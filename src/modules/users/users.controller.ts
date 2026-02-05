import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto'; // NUEVO
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from './entities/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (public)' })
  async register(@Body() createUserDto: CreateUserDto) {
    createUserDto.role = UserRole.USER;
    return this.usersService.create(createUserDto);
  }

@Post('admin')
@Roles(UserRole.SUPER_ADMIN)
async createAdminUser(
  @Body() createAdminUserDto: CreateAdminUserDto,
  @Request() req,
) {
  console.log('=== CREATE ADMIN USER ===');
  
  const currentUserEntity = await this.usersService.findOne(req.user.sub, req.user);
  
  let password = createAdminUserDto.password;
  if (createAdminUserDto.generatePassword && !password) {
    password = this.generateRandomPassword();
  }

  const createUserDto: CreateUserDto = {
    email: createAdminUserDto.email,
    firstName: createAdminUserDto.firstName,
    lastName: createAdminUserDto.lastName,
    password: password!,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    avatarUrl: createAdminUserDto.avatarUrl,
  };

  return this.usersService.create(createUserDto, currentUserEntity);
}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async findAll(
    @Request() req,
    @Query('status') status?: UserStatus,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    const currentUser = req.user;
    const filters = { status, role, search };
    return this.usersService.findAll(filters, currentUser);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.usersService.findOne(id, currentUser);
  }

  @Post(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.usersService.remove(id, currentUser);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async activateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.usersService.activateUser(id, currentUser);
  }

  @Post(':id/suspend')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async suspendUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    const currentUser = req.user;
    return this.usersService.suspendUser(id, currentUser);
  }

  @Get('stats/overview')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStats(@Request() req) {
    const currentUser = req.user;
    return this.usersService.getStats(currentUser);
  }

  @Get('role/admin')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all admin users (super-admin only)' })
  async getAdminUsers(@Request() req) {
    const currentUser = req.user;
    return this.usersService.findAll({ role: UserRole.ADMIN }, currentUser);
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}