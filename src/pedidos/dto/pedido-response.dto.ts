import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DireccionEnvioDto, MetodoPagoEnum } from './create-pedido.dto.js';

export enum EstadoPedidoEnum {
  PENDIENTE_PAGO = 'pendiente_pago',
  PAGADO = 'pagado',
  EN_PREPARACION = 'en_preparacion',
  ENVIADO = 'enviado',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
  RECHAZADO = 'rechazado',
}

export class ItemPedidoResponseDto {
  @ApiProperty({ example: 'zap-001' })
  zapatillaId: string;

  @ApiProperty({ example: 'Pizzo Velocity 3D Pro' })
  nombre: string;

  @ApiProperty({ example: 2 })
  cantidad: number;

  @ApiProperty({ example: 42 })
  talla: number;

  @ApiProperty({ example: 289.90 })
  precioUnitario: number;

  @ApiProperty({ example: 579.80 })
  subtotal: number;
}

export class PedidoResponseDto {
  @ApiProperty({ example: 'ped-1729000000000' })
  id: string;

  @ApiProperty({ example: 'user-mock-123' })
  usuarioId: string;

  @ApiProperty({ type: [ItemPedidoResponseDto] })
  items: ItemPedidoResponseDto[];

  @ApiProperty({ example: 15.00 })
  montoEnvio: number;

  @ApiProperty({ example: 579.80 })
  montoSubtotal: number;

  @ApiProperty({ example: 594.80 })
  montoTotal: number;

  @ApiProperty({ enum: EstadoPedidoEnum, example: EstadoPedidoEnum.PENDIENTE_PAGO })
  estado: EstadoPedidoEnum;

  @ApiProperty({ enum: MetodoPagoEnum, example: MetodoPagoEnum.MERCADO_PAGO })
  metodoPago: MetodoPagoEnum;

  @ApiProperty({ type: DireccionEnvioDto })
  direccionEnvio: DireccionEnvioDto;

  @ApiPropertyOptional({ example: 'Llamar antes de entregar' })
  notas?: string;

  @ApiPropertyOptional({ example: 'https://sandbox.mercadopago.com.pe/checkout/v1/redirect?pref_id=123' })
  urlPago?: string;

  @ApiProperty({ example: '2026-10-24T16:00:00.000Z' })
  fechaCreacion: string;

  @ApiPropertyOptional({ example: '2026-10-24T16:00:00.000Z' })
  fechaActualizacion?: string;
}
