import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CrearPagoDto } from './dto/crear-pago.dto.js';
import { PagoResponseDto } from './dto/pago-response.dto.js';
import { ConfirmarPagoSimuladoDto, WebhookPagoDto } from './dto/webhook-pago.dto.js';
import { PagosService } from './pagos.service.js';

@ApiTags('Pagos / Pasarela Sandbox')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('crear-preferencia')
  @ApiOperation({
    summary: 'Generar preferencia de pago (Mercado Pago / Sandbox)',
    description: 'Crea una preferencia de checkout en sandbox para iniciar el proceso de pago seguro.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferencia de pago generada exitosamente',
    type: PagoResponseDto,
  })
  crearPreferencia(@Body() crearPagoDto: CrearPagoDto): Promise<PagoResponseDto> {
    return this.pagosService.crearPreferencia(crearPagoDto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook receptor de eventos de la pasarela de pagos',
    description: 'Recibe notificaciones automáticas de la pasarela (Mercado Pago / Stripe / Culqi) para actualizar el estado del pedido a pagado o rechazado.',
  })
  @ApiResponse({ status: 200, description: 'Notificación procesada' })
  procesarWebhook(@Body() webhookDto: WebhookPagoDto) {
    return this.pagosService.procesarWebhook(webhookDto);
  }

  @Post('confirmar-simulado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmación manual de pago simulado (Entorno de desarrollo Sandbox)',
    description: 'Permite aprobar o rechazar un pago manualmente desde Swagger o Postman para validar la experiencia de compra en el cliente móvil o web.',
  })
  @ApiResponse({ status: 200, description: 'Pago simulado actualizado' })
  confirmarSimulado(@Body() dto: ConfirmarPagoSimuladoDto) {
    return this.pagosService.confirmarPagoSimulado(dto.pedidoId, dto.estado);
  }
}
