import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { PedidoResponseDto } from './dto/pedido-response.dto.js';
import { PedidosService } from './pedidos.service.js';

// req.user lo llena el guardia solo si la petición trae un token válido.
type RequestConUsuario = { user?: { id?: string } | null };

// Sin token (login simulado de la app) los pedidos quedan a nombre de "invitado".
const usuarioDe = (req: RequestConUsuario): string => req.user?.id ?? 'invitado';

@ApiTags('Pedidos')
@UseGuards(OptionalJwtAuthGuard)
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo pedido',
    description:
      'Recibe los items del carrito, dirección de envío y método de pago para registrar el pedido con estado inicial pendiente_pago. El precio se toma de la base de datos.',
  })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente', type: PedidoResponseDto })
  create(
    @Body() createPedidoDto: CreatePedidoDto,
    @Req() req: RequestConUsuario,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.create(createPedidoDto, usuarioDe(req));
  }

  @Get('mis')
  @ApiOperation({
    summary: 'Obtener mis pedidos',
    description: 'Retorna los pedidos del usuario del token (o de "invitado" si no se envía token).',
  })
  @ApiResponse({ status: 200, description: 'Lista de pedidos del usuario', type: [PedidoResponseDto] })
  findMisPedidos(@Req() req: RequestConUsuario): Promise<PedidoResponseDto[]> {
    return this.pedidosService.findMisPedidos(usuarioDe(req));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de pedido por ID' })
  @ApiParam({ name: 'id', description: 'ID del pedido' })
  @ApiResponse({ status: 200, description: 'Detalle del pedido', type: PedidoResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  findOne(@Param('id') id: string): Promise<PedidoResponseDto> {
    return this.pedidosService.findOne(id);
  }
}
