import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { User, UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

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

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
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

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
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

      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
      };
    } catch (error) {
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
}