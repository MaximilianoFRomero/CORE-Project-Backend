import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, UserStatus } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.user);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('status') status?: UserStatus,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ status, role, search }, req.user);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.usersService.getStats(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user);
  }

  @Get('profile/me')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Patch('profile/me')
  updateProfile(@Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(req.user.id, updateUserDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user);
  }

  @Post(':id/activate')
  @Roles(UserRole.ADMIN)
  activateUser(@Param('id') id: string, @Request() req) {
    return this.usersService.activateUser(id, req.user);
  }

  @Post(':id/suspend')
  @Roles(UserRole.ADMIN)
  suspendUser(@Param('id') id: string, @Request() req) {
    return this.usersService.suspendUser(id, req.user);
  }

  // backend/src/modules/users/users.controller.ts - Agregar
@Post('admin')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN) // Necesitarás implementar este decorador
async createAdmin(
  @Body() createUserDto: CreateUserDto,
  @Request() req,
) {
  // Solo Super Admin puede crear otros admins
  const adminUser = await this.usersService.create({
    ...createUserDto,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  }, req.user);
  
  return {
    message: 'Admin user created successfully',
    user: adminUser,
  };
}
}