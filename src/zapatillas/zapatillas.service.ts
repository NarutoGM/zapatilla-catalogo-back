import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import sharp from 'sharp';
import { FirebaseService } from '../firebase/firebase.service.js';
import { CreateZapatillaDto } from './dto/create-zapatilla.dto.js';
import { FilterZapatillasDto, OrdenCriterio } from './dto/filter-zapatillas.dto.js';
import { UpdateZapatillaDto } from './dto/update-zapatilla.dto.js';
import { UploadedFileDto } from './file-upload.interface.js';

export interface Zapatilla {
  id: string;
  nombre: string;
  marca: string;
  precio: number;
  talla: string;
  stock: number;
  imagenUrl?: string;
  modelo3dUrl?: string;
  descripcion?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ZapatillasService {
  private collectionName = 'zapatillas';

  constructor(private firebaseService: FirebaseService) {}

  private get collection() {
    return this.firebaseService.getFirestore().collection(this.collectionName);
  }

  // Sube archivo a Firebase Storage optimizando automáticamente las imágenes a WebP
  async uploadFile(file: UploadedFileDto, folder = 'zapatillas'): Promise<{ url: string; fileName: string }> {
    if (!file) {
      throw new BadRequestException('No se envió ningún archivo');
    }

    const bucket = this.firebaseService.getBucket();
    const originalExt = extname(file.originalname).toLowerCase();

    let uploadBuffer = file.buffer;
    let contentType = file.mimetype;
    let fileExtension = originalExt;

    // Si es una imagen (PNG, JPG, JPEG, TIFF), la convertimos y comprimimos a WebP
    const isImage = file.mimetype.startsWith('image/') && !file.mimetype.includes('svg');
    if (isImage) {
      try {
        uploadBuffer = await sharp(file.buffer)
          .webp({ quality: 80 }) // Optimización con excelente calidad visual y ~70% menos peso
          .toBuffer();
        contentType = 'image/webp';
        fileExtension = '.webp';
      } catch (err) {
        console.warn('No se pudo convertir a WebP, subiendo en formato original:', err);
      }
    }

    const fileName = `${folder}/${randomUUID()}${fileExtension}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(uploadBuffer, {
      metadata: {
        contentType,
      },
      public: true,
    });

    try {
      await fileUpload.makePublic();
    } catch {
      // Ignored if bucket enforces uniform access or is already public
    }

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return {
      url: publicUrl,
      fileName,
    };
  }

  // Elimina un archivo físico de Firebase Storage dado su URL
  async deleteFileFromStorage(fileUrl?: string): Promise<boolean> {
    if (!fileUrl) return false;

    try {
      const bucket = this.firebaseService.getBucket();
      // Formato típico: https://storage.googleapis.com/<bucketName>/<filePath>
      const prefix = `https://storage.googleapis.com/${bucket.name}/`;
      if (!fileUrl.startsWith(prefix)) {
        return false;
      }

      const filePath = decodeURIComponent(fileUrl.replace(prefix, ''));
      const file = bucket.file(filePath);

      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
        return true;
      }
    } catch (error) {
      console.warn(`No se pudo eliminar el archivo antiguo de Storage: ${fileUrl}`, error);
    }
    return false;
  }

  async create(createDto: CreateZapatillaDto): Promise<Zapatilla> {
    const now = new Date().toISOString();
    const docRef = await this.collection.add({
      ...createDto,
      activo: createDto.activo !== undefined ? createDto.activo : true,
      createdAt: now,
      updatedAt: now,
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...(doc.data() as Omit<Zapatilla, 'id'>),
    };
  }

  // Lista solo las zapatillas ACTIVAS para el catálogo público
  // (o todas con ?all=true, para el panel admin) y aplica los filtros de búsqueda.
  async findAll(filters: FilterZapatillasDto = {}): Promise<Zapatilla[]> {
    const includeInactive = filters.all === 'true';
    let query: any = this.collection;
    if (!includeInactive) {
      query = query.where('activo', '==', true);
    }

    const snapshot = await query.get();
    const zapatillas: Zapatilla[] = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...(doc.data() as Omit<Zapatilla, 'id'>),
    }));

    return this.aplicarFiltros(zapatillas, filters);
  }

  // Firestore no busca texto dentro de un campo, así que los filtros se aplican
  // en el servidor sobre la lista que ya se trajo.
  private aplicarFiltros(zapatillas: Zapatilla[], f: FilterZapatillasDto): Zapatilla[] {
    let result = zapatillas;

    if (f.q && f.q.trim()) {
      const term = f.q.toLowerCase().trim();
      result = result.filter(
        (z) =>
          (z.nombre ?? '').toLowerCase().includes(term) ||
          (z.marca ?? '').toLowerCase().includes(term) ||
          (z.descripcion ?? '').toLowerCase().includes(term),
      );
    }

    if (f.marca && f.marca.trim()) {
      const marca = f.marca.toLowerCase().trim();
      result = result.filter((z) => (z.marca ?? '').toLowerCase() === marca);
    }

    if (f.talla !== undefined) {
      // La talla se guarda como texto y puede traer varias: "40, 41, 42"
      result = result.filter((z) => this.tallasDe(z).includes(f.talla as number));
    }

    if (f.precioMin !== undefined) {
      result = result.filter((z) => z.precio >= (f.precioMin as number));
    }

    if (f.precioMax !== undefined) {
      result = result.filter((z) => z.precio <= (f.precioMax as number));
    }

    if (f.soloConStock) {
      result = result.filter((z) => z.stock > 0);
    }

    switch (f.orden) {
      case OrdenCriterio.PRECIO_ASC:
        result = [...result].sort((a, b) => a.precio - b.precio);
        break;
      case OrdenCriterio.PRECIO_DESC:
        result = [...result].sort((a, b) => b.precio - a.precio);
        break;
      case OrdenCriterio.NUEVO:
        result = [...result].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
        break;
      case OrdenCriterio.NOMBRE:
        result = [...result].sort((a, b) => (a.nombre ?? '').localeCompare(b.nombre ?? ''));
        break;
    }

    return result;
  }

  private tallasDe(z: Zapatilla): number[] {
    return String(z.talla ?? '')
      .split(/[,;/\s]+/)
      .map((t) => Number(t))
      .filter((n) => !Number.isNaN(n));
  }

  async findOne(id: string): Promise<Zapatilla> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      throw new NotFoundException(`Zapatilla con id ${id} no encontrada`);
    }

    const data = doc.data() as Omit<Zapatilla, 'id'>;
    return {
      id: doc.id,
      ...data,
    };
  }

  async update(id: string, updateDto: UpdateZapatillaDto): Promise<Zapatilla> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Zapatilla con id ${id} no encontrada`);
    }

    const currentData = doc.data() as Zapatilla;

    // Si viene una imagenUrl nueva y es distinta a la anterior, borramos la antigua de Storage
    if (updateDto.imagenUrl && currentData.imagenUrl && updateDto.imagenUrl !== currentData.imagenUrl) {
      await this.deleteFileFromStorage(currentData.imagenUrl);
    }

    // Si viene un modelo3dUrl nuevo y es distinto al anterior, borramos el antiguo
    if (updateDto.modelo3dUrl && currentData.modelo3dUrl && updateDto.modelo3dUrl !== currentData.modelo3dUrl) {
      await this.deleteFileFromStorage(currentData.modelo3dUrl);
    }

    const updatedData = {
      ...updateDto,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updatedData);
    const updatedDoc = await docRef.get();

    return {
      id: updatedDoc.id,
      ...(updatedDoc.data() as Omit<Zapatilla, 'id'>),
    };
  }

  // Soft delete: Cambia activo a false en vez de borrar de la base de datos
  async deactivate(id: string): Promise<{ message: string; zapatilla: Zapatilla }> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException(`Zapatilla con id ${id} no encontrada`);
    }

    const now = new Date().toISOString();
    await docRef.update({
      activo: false,
      updatedAt: now,
    });

    const updatedDoc = await docRef.get();

    return {
      message: `Zapatilla ${id} desactivada correctamente (no se mostrará en el catálogo)`,
      zapatilla: {
        id: updatedDoc.id,
        ...(updatedDoc.data() as Omit<Zapatilla, 'id'>),
      },
    };
  }
}
