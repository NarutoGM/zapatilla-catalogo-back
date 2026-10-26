import { ApiProperty } from '@nestjs/swagger';

export class PagoResponseDto {
  @ApiProperty({ example: 'PREF-SANDBOX-987654321' })
  preferenciaId: string;

  @ApiProperty({ example: 'ped-1729000000000' })
  pedidoId: string;

  @ApiProperty({ example: 'https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=PREF-SANDBOX-987654321' })
  initPoint: string;

  @ApiProperty({ example: 'https://sandbox.mercadopago.com.pe/checkout/v1/redirect?pref_id=PREF-SANDBOX-987654321' })
  sandboxInitPoint: string;

  @ApiProperty({ example: 594.80 })
  montoTotal: number;

  @ApiProperty({ example: 'creado' })
  estado: string;
}
