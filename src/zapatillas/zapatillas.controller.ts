import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZapatillasService } from './zapatillas.service.js';
import { CreateZapatillaDto } from './dto/create-zapatilla.dto.js';
import { UpdateZapatillaDto } from './dto/update-zapatilla.dto.js';
import { FilterZapatillasDto } from './dto/filter-zapatillas.dto.js';
import { UploadedFileDto } from './file-upload.interface.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../auth/user.interface.js';

@Controller('zapatillas')
export class ZapatillasController {
  constructor(private readonly zapatillasService: ZapatillasService) {}

  // Catálogo público: solo devuelve zapatillas activas (o todas si admin envía ?all=true).
  // Admite filtros: q, marca, talla, precioMin, precioMax, orden, soloConStock
  @Get()
  findAll(@Query() filters: FilterZapatillasDto) {
    return this.zapatillasService.findAll(filters);
  }

  // Ver detalle
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zapatillasService.findOne(id);
  }

  // SOLO ADMIN: Subir imagen o modelo 3D a Firebase Storage
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: UploadedFileDto) {
    return this.zapatillasService.uploadFile(file);
  }

  // SOLO ADMIN: Agregar zapatilla
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createZapatillaDto: CreateZapatillaDto) {
    return this.zapatillasService.create(createZapatillaDto);
  }

  // SOLO ADMIN: Editar zapatilla (precio, stock, volver a activar con activo: true, etc.)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateZapatillaDto: UpdateZapatillaDto,
  ) {
    return this.zapatillasService.update(id, updateZapatillaDto);
  }

  // SOLO ADMIN: Desactivar zapatilla (Soft delete)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.zapatillasService.deactivate(id);
  }
}
