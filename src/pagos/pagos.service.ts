import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PedidosService } from '../pedidos/pedidos.service.js';
import { EstadoPedidoEnum } from '../pedidos/dto/pedido-response.dto.js';
import { CrearPagoDto } from './dto/crear-pago.dto.js';
import { PagoResponseDto } from './dto/pago-response.dto.js';
import { WebhookPagoDto } from './dto/webhook-pago.dto.js';

// Pasarela SIMULADA: no se conecta a Mercado Pago. Genera una preferencia de
// mentira y el pago se aprueba o rechaza con /pagos/confirmar-simulado.
@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(private readonly pedidosService: PedidosService) {}

  async crearPreferencia(crearPagoDto: CrearPagoDto): Promise<PagoResponseDto> {
    const pedido = await this.pedidosService.findOne(crearPagoDto.pedidoId);

    if (pedido.estado === EstadoPedidoEnum.PAGADO) {
      throw new BadRequestException('El pedido ya se encuentra pagado.');
    }

    const prefId = `PREF-SANDBOX-${Date.now()}`;
    const sandboxUrl = `https://sandbox.mercadopago.com.pe/checkout/v1/redirect?pref_id=${prefId}`;
    const initPointUrl = `https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=${prefId}`;

    // Se guarda en el pedido el link de pago generado
    await this.pedidosService.actualizarEstado(pedido.id, EstadoPedidoEnum.PENDIENTE_PAGO, sandboxUrl);

    this.logger.log(`Preferencia Sandbox generada para Pedido '${pedido.id}': ${prefId}`);

    return {
      preferenciaId: prefId,
      pedidoId: pedido.id,
      initPoint: initPointUrl,
      sandboxInitPoint: sandboxUrl,
      montoTotal: pedido.montoTotal,
      estado: 'creado',
    };
  }

  // Notificación automática (webhook) de la pasarela.
  async procesarWebhook(webhookData: WebhookPagoDto) {
    this.logger.log(`Webhook recibido: ${JSON.stringify(webhookData)}`);

    const pedidoId = webhookData.external_reference;
    const status = (webhookData.status || 'approved').toLowerCase();

    if (!pedidoId) {
      return {
        recibido: true,
        mensaje: 'Webhook procesado sin referencia externa de pedido.',
      };
    }

    let nuevoEstado = EstadoPedidoEnum.PENDIENTE_PAGO;
    if (status === 'approved' || status === 'accredited' || status === 'paid') {
      nuevoEstado = EstadoPedidoEnum.PAGADO;
    } else if (status === 'rejected' || status === 'cancelled') {
      nuevoEstado = EstadoPedidoEnum.RECHAZADO;
    }

    const pedidoActualizado = await this.pedidosService.actualizarEstado(pedidoId, nuevoEstado);

    return {
      recibido: true,
      pedidoId: pedidoActualizado.id,
      nuevoEstadoPedido: pedidoActualizado.estado,
      mensaje: 'Estado del pedido actualizado correctamente desde Webhook.',
    };
  }

  // Confirmación manual del pago simulado (aprobado o rechazado).
  async confirmarPagoSimulado(pedidoId: string, estado: string) {
    const isApproved = estado.toLowerCase() === 'approved' || estado.toLowerCase() === 'pagado';
    const nuevoEstado = isApproved ? EstadoPedidoEnum.PAGADO : EstadoPedidoEnum.RECHAZADO;

    const pedido = await this.pedidosService.actualizarEstado(pedidoId, nuevoEstado);

    return {
      exito: true,
      pedidoId: pedido.id,
      estado: pedido.estado,
      montoTotal: pedido.montoTotal,
      mensaje: `Pago ${isApproved ? 'Aprobado' : 'Rechazado'} exitosamente en modo Sandbox.`,
    };
  }
}
