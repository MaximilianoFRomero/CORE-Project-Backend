import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
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
