import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener el token JWT del header Authorization
 * 
 * Uso: @GetToken() token: string
 */
export const GetToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

    // Extraer token de "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }

    return null;
  }
);
