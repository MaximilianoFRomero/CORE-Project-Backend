import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';
import { JWT_CONFIG } from '../../config/jwt.config';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || JWT_CONFIG.JWT_SECRET,
      signOptions: {
        expiresIn: 900, // 15 minutos en segundos
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar rate limiting a endpoints críticos
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        'auth/login',
        'auth/refresh',
        'auth/forgot-password'
      );
  }
}