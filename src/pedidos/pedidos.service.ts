import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service.js';
import { ZapatillasService } from '../zapatillas/zapatillas.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import {
  EstadoPedidoEnum,
  ItemPedidoResponseDto,
  PedidoResponseDto,
} from './dto/pedido-response.dto.js';

const COSTO_ENVIO = 15.0;

@Injectable()
export class PedidosService {
  private readonly collectionName = 'pedidos';

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly zapatillasService: ZapatillasService,
  ) {}

  private get collection() {
    return this.firebaseService.getFirestore().collection(this.collectionName);
  }

  async create(dto: CreatePedidoDto, usuarioId: string): Promise<PedidoResponseDto> {
    const items: ItemPedidoResponseDto[] = [];
    let subtotal = 0;

    for (const item of dto.items) {
      // Si la zapatilla no existe, findOne responde 404.
      const zapatilla = await this.zapatillasService.findOne(item.zapatillaId);

      // El precio sale de la base de datos, no de lo que mande el cliente.
      const precioUnitario = zapatilla.precio;
      const itemSubtotal = Number((precioUnitario * item.cantidad).toFixed(2));
      subtotal += itemSubtotal;

      items.push({
        zapatillaId: item.zapatillaId,
        nombre: zapatilla.nombre,
        cantidad: item.cantidad,
        talla: item.talla,
        precioUnitario,
        subtotal: itemSubtotal,
      });
    }

    const montoSubtotal = Number(subtotal.toFixed(2));
    const datos: Omit<PedidoResponseDto, 'id'> = {
      usuarioId,
      items,
      montoEnvio: COSTO_ENVIO,
      montoSubtotal,
      montoTotal: Number((montoSubtotal + COSTO_ENVIO).toFixed(2)),
      estado: EstadoPedidoEnum.PENDIENTE_PAGO,
      metodoPago: dto.metodoPago,
      // Se copia a un objeto simple: Firestore no acepta instancias de clases.
      direccionEnvio: { ...dto.direccionEnvio },
      notas: dto.notas,
      fechaCreacion: new Date().toISOString(),
    };

    const ref = await this.collection.add(datos);
    return { id: ref.id, ...datos };
  }

  async findMisPedidos(usuarioId: string): Promise<PedidoResponseDto[]> {
    const snapshot = await this.collection.where('usuarioId', '==', usuarioId).get();
    const lista = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<PedidoResponseDto, 'id'>),
    }));
    // Se ordena aquí para no obligar a crear un índice compuesto en Firestore.
    return lista.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
  }

  async findOne(id: string): Promise<PedidoResponseDto> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Pedido con id '${id}' no encontrado`);
    }
    return { id: doc.id, ...(doc.data() as Omit<PedidoResponseDto, 'id'>) };
  }

  async actualizarEstado(
    id: string,
    nuevoEstado: EstadoPedidoEnum,
    urlPago?: string,
  ): Promise<PedidoResponseDto> {
    const ref = this.collection.doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      throw new NotFoundException(`Pedido con id '${id}' no encontrado`);
    }

    await ref.update({
      estado: nuevoEstado,
      fechaActualizacion: new Date().toISOString(),
      ...(urlPago ? { urlPago } : {}),
    });

    return this.findOne(id);
  }
}
