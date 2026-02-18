import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UsersService } from '../users/users.service';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { User, UserStatus } from '../users/entities/user.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  // Almacenar refresh tokens revocados (en producción usar Redis)
  private revokedTokens = new Set<string>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) { }

  async validateUser(email: string, password: string): Promise<any> {
    console.log('🔐 Validando usuario:', email);

    const user = await this.usersService.findByEmail(email);

    console.log('🔐 Usuario encontrado en DB:', {
      exists: !!user,
      email: user?.email,
      status: user?.status,
      passwordLength: user?.password?.length
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      console.log('❌ Usuario no activo:', user.status);
      throw new UnauthorizedException('Account is not active');
    }

    console.log('🔐 Comparando contraseñas...');
    console.log('   Password ingresado:', password);
    console.log('   Hash en DB (primeros 30):', user.password?.substring(0, 30));

    const isValidPassword = await bcrypt.compare(password, user.password);

    console.log('🔐 Resultado comparación:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Contraseña inválida');
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.updateLastLogin(user.id);

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.validateUser(loginUserDto.email, loginUserDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Access token: 15 minutos
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m'
    });

    // Refresh token: 30 días si rememberMe es true, sino 7 días
    const refreshTokenExpiresIn = loginUserDto.rememberMe ? '30d' : '7d';
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiresIn
    });

    // Calcular expiresIn en segundos para el frontend
    const accessExpiresIn = 900; // 15m

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expiresIn: accessExpiresIn,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * Refresh Token Endpoint
   * 
   * Valida el refresh token y emite uno nuevo.
   * 
   * @param refreshToken - El refresh token del usuario
   * @returns Nuevo access_token y refresh_token
   * @throws UnauthorizedException si el token es inválido o expiró
   */
  async refreshToken(refreshTokenString: string) {
    try {
      // Verificar que el token no ha sido revocado en la base de datos
      const isRevoked = await this.isTokenRevoked(refreshTokenString);
      if (isRevoked) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Validar la firma JWT
      const payload = this.jwtService.verify(refreshTokenString);

      // Obtener usuario y verificar que siga activo
      const user = await this.usersService.findOne(payload.sub);

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Account is not active');
      }

      // Crear nuevo payload
      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      // Generar nuevos tokens
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m'
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d'
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expiresIn: 900, // 15 minutos en segundos
      };
    } catch (error: any) {
      // Diferenciar entre errores de expiración y otros
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token signature');
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(createUserDto: any) {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.usersService.create({
      ...createUserDto,
      status: UserStatus.PENDING,
    });

    // Enviar email de verificación (implementar después)
    // await this.emailService.sendVerificationEmail(user);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  /**
   * Logout Endpoint
   * 
   * Invalida el refresh token del usuario.
   * El frontend debe limpiar los tokens locales.
   * 
   * @param refreshToken - El refresh token a revocar
   * @returns Mensaje de éxito
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    try {
      if (!refreshToken) {
        return { message: 'Logged out successfully' };
      }

      // Validar el token y obtener expiración
      const payload = this.jwtService.verify(refreshToken);

      // Guardar en la lista negra persistente
      const blacklistEntry = this.tokenBlacklistRepository.create({
        token: refreshToken,
        expiresAt: new Date(payload.exp * 1000),
      });

      await this.tokenBlacklistRepository.save(blacklistEntry);

      return { message: 'Logged out successfully' };
    } catch (error) {
      // Incluso si el token es inválido o ya expiró, consideramos el logout exitoso
      return { message: 'Logged out successfully' };
    }
  }

  /**
   * Verifica si un token está en la lista negra
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    const entry = await this.tokenBlacklistRepository.findOne({
      where: {
        token,
        expiresAt: MoreThan(new Date()) // Solo tokens que aún no habrían expirado naturalmente
      },
    });
    return !!entry;
  }

  /**
   * Forgot Password Endpoint
   * 
   * Genera un token de reset y lo envía por email al usuario.
   * 
   * @param email - Email del usuario
   * @returns Mensaje indicando que el email fue enviado
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        // Retornamos éxito de todos modos
        return {
          message: 'If an account with this email exists, you will receive a password reset link shortly.',
        };
      }

      // Generar token de reset (válido por 1 hora)
      const resetToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          type: 'password-reset',
        },
        { expiresIn: '1h' }
      );

      // TODO: Guardar token en BD con expiration
      // await this.passwordResetService.create(user.id, resetToken);

      // TODO: Enviar email con link de reset
      // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      // await this.emailService.sendPasswordResetEmail(user.email, resetLink);

      console.log(`📧 Reset token para ${email}:`, resetToken);

      return {
        message: 'If an account with this email exists, you will receive a password reset link shortly.',
      };
    } catch (error) {
      // Por seguridad, no revelamos errores
      return {
        message: 'If an account with this email exists, you will receive a password reset link shortly.',
      };
    }
  }
}