import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Interceptor para manejar errores de autenticación
 * 
 * Asegura que todos los endpoints protegidos retornen 401
 * cuando hay problemas con el token JWT
 */
@Injectable()
export class AuthErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Si es un error de autenticación, aseguramos que sea 401
        if (
          error instanceof UnauthorizedException ||
          error.message?.includes('Unauthorized') ||
          error.message?.includes('Token') ||
          error.message?.includes('token')
        ) {
          throw new UnauthorizedException(error.message || 'Unauthorized');
        }
        throw error;
      })
    );
  }
}
