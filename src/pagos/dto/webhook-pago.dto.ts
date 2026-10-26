import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class WebhookPagoDataDto {
  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  id?: string;
}

export class WebhookPagoDto {
  @ApiPropertyOptional({ example: 'payment.created' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'payment' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ type: WebhookPagoDataDto })
  @IsOptional()
  data?: WebhookPagoDataDto;

  @ApiPropertyOptional({ example: 'ped-1729000000000' })
  @IsOptional()
  @IsString()
  external_reference?: string;

  @ApiPropertyOptional({ example: 'approved', description: 'approved | pending | rejected' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ConfirmarPagoSimuladoDto {
  @ApiPropertyOptional({ example: 'ped-1729000000000' })
  @IsString()
  pedidoId: string;

  @ApiPropertyOptional({ example: 'approved', description: 'approved | pending | rejected' })
  @IsString()
  estado: string;
}
