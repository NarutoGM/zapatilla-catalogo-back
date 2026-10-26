import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Deja pasar la petición con o sin token. Si el token es válido, req.user trae al
// usuario; si no hay token (o no es válido), req.user queda en null.
// Se usa en pedidos porque el login de la app móvil todavía es simulado.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(_err: unknown, user: any) {
    return user || null;
  }
}
