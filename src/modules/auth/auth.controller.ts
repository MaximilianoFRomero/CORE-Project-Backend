import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * 
   * Autentica un usuario y retorna access_token y refresh_token
   * 
   * Request: { email, password }
   * Response: { access_token, refresh_token, expiresIn, user }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  /**
   * POST /auth/register
   * 
   * Registra un nuevo usuario
   * 
   * Request: { email, password, firstName, lastName }
   * Response: { message, userId }
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /**
   * POST /auth/refresh
   * 
   * Obtiene un nuevo access_token usando el refresh_token
   * 
   * Request: { refreshToken: string }
   * Response: { access_token, refresh_token, expiresIn }
   * Status: 401 si el refresh_token expiró o es inválido
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  /**
   * POST /auth/logout
   * 
   * Invalida el refresh_token del usuario
   * El frontend debe limpiar los tokens locales
   * 
   * Headers: Authorization: Bearer <access_token>
   * Request: { refreshToken: string }
   * Response: { message: "Logged out successfully" }
   * Status: 401 si no hay autorización
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  /**
   * POST /auth/forgot-password
   * 
   * Solicita un reset de contraseña
   * Envía un email con un link de reset
   * 
   * Request: { email: string }
   * Response: { message: "If an account with this email exists..." }
   * Status: 200 siempre (por seguridad, no revelamos si el email existe)
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * POST /auth/validate
   * 
   * Valida que el token actual es válido
   * Retorna los datos del usuario autenticado
   * 
   * Headers: Authorization: Bearer <access_token>
   * Response: { valid: true, user: {...} }
   * Status: 401 si no hay token válido
   */
  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  validate(@Request() req) {
    return { valid: true, user: req.user };
  }
}