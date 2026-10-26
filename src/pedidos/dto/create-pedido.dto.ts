import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum MetodoPagoEnum {
  MERCADO_PAGO = 'mercado_pago',
  STRIPE = 'stripe',
  CULQI = 'culqi',
  TARJETA = 'tarjeta',
  EFECTIVO = 'efectivo',
}

export class DireccionEnvioDto {
  @ApiProperty({ example: 'Av. España 123, Urb. El Recreo' })
  @IsString()
  @IsNotEmpty()
  calle: string;

  @ApiProperty({ example: 'Trujillo' })
  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @ApiProperty({ example: 'La Libertad' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiPropertyOptional({ example: '13001' })
  @IsOptional()
  @IsString()
  codigoPostal?: string;

  @ApiProperty({ example: '987654321' })
  @IsString()
  @IsNotEmpty()
  telefono: string;
}

export class ItemPedidoDto {
  @ApiProperty({ example: 'zap-001' })
  @IsString()
  @IsNotEmpty()
  zapatillaId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiProperty({ example: 42 })
  @IsInt()
  @Min(30)
  talla: number;

  @ApiProperty({ example: 289.90 })
  @IsNumber()
  @Min(0)
  precioUnitario: number;
}

export class CreatePedidoDto {
  @ApiProperty({ type: [ItemPedidoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  items: ItemPedidoDto[];

  @ApiProperty({ type: DireccionEnvioDto })
  @ValidateNested()
  @Type(() => DireccionEnvioDto)
  direccionEnvio: DireccionEnvioDto;

  @ApiProperty({ enum: MetodoPagoEnum, example: MetodoPagoEnum.MERCADO_PAGO })
  @IsEnum(MetodoPagoEnum)
  metodoPago: MetodoPagoEnum;

  @ApiPropertyOptional({ example: 'Llamar antes de entregar' })
  @IsOptional()
  @IsString()
  notas?: string;
}
