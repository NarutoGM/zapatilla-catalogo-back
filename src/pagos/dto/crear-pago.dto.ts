import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearPagoDto {
  @ApiProperty({ example: 'ped-1729000000000', description: 'ID del pedido a pagar' })
  @IsString()
  @IsNotEmpty()
  pedidoId: string;

  @ApiPropertyOptional({ example: 'mercado_pago', description: 'Pasarela de pago seleccionada' })
  @IsOptional()
  @IsString()
  metodoPago?: string;

  @ApiPropertyOptional({ example: 'pizzoapp://checkout/success', description: 'URL de retorno a la app móvil' })
  @IsOptional()
  @IsString()
  redirectUrl?: string;
}
