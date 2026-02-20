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

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m'
    });

    const refreshTokenExpiresIn = loginUserDto.rememberMe ? '30d' : '7d';
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiresIn
    });

    const accessExpiresIn = 900;

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

  async refreshToken(refreshTokenString: string) {
    try {
      const isRevoked = await this.isTokenRevoked(refreshTokenString);
      if (isRevoked) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const payload = this.jwtService.verify(refreshTokenString);

      const user = await this.usersService.findOne(payload.sub);

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Account is not active');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m'
      });

      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d'
      });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expiresIn: 900,
      };
    } catch (error: any) {
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

  async logout(refreshToken: string): Promise<{ message: string }> {
    try {
      if (!refreshToken) {
        return { message: 'Logged out successfully' };
      }

      const payload = this.jwtService.verify(refreshToken);

      const blacklistEntry = this.tokenBlacklistRepository.create({
        token: refreshToken,
        expiresAt: new Date(payload.exp * 1000),
      });

      await this.tokenBlacklistRepository.save(blacklistEntry);

      return { message: 'Logged out successfully' };
    } catch (error) {
      return { message: 'Logged out successfully' };
    }
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const entry = await this.tokenBlacklistRepository.findOne({
      where: {
        token,
        expiresAt: MoreThan(new Date())
      },
    });
    return !!entry;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        return {
          message: 'If an account with this email exists, you will receive a password reset link shortly.',
        };
      }

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
      return {
        message: 'If an account with this email exists, you will receive a password reset link shortly.',
      };
    }
  }
}