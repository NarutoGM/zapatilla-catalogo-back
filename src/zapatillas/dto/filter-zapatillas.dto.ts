import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum OrdenCriterio {
  PRECIO_ASC = 'precio_asc',
  PRECIO_DESC = 'precio_desc',
  NUEVO = 'nuevo',
  NOMBRE = 'nombre',
}

// Parámetros de búsqueda de GET /zapatillas (todos opcionales).
// El servidor rechaza los parámetros que no estén declarados aquí.
export class FilterZapatillasDto {
  @ApiPropertyOptional({
    description: 'Incluir también las zapatillas desactivadas (uso del panel admin)',
    example: 'true',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  all?: string;

  @ApiPropertyOptional({ description: 'Búsqueda por texto (nombre, marca o descripción)', example: 'Runner' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtro por marca (coincidencia exacta, sin distinguir mayúsculas)', example: 'Nike' })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional({ description: 'Filtro por talla disponible', example: 42 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  talla?: number;

  @ApiPropertyOptional({ description: 'Precio mínimo', example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMin?: number;

  @ApiPropertyOptional({ description: 'Precio máximo', example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioMax?: number;

  @ApiPropertyOptional({
    description: 'Criterio de ordenación',
    enum: OrdenCriterio,
    example: OrdenCriterio.PRECIO_ASC,
  })
  @IsOptional()
  @IsEnum(OrdenCriterio)
  orden?: OrdenCriterio;

  @ApiPropertyOptional({ description: 'Devolver solo zapatillas con stock disponible', example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  soloConStock?: boolean;
}
