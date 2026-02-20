import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, currentUser?: any): Promise<User> {
    console.log('=== USERS SERVICE CREATE ===');
    console.log('Current user:', currentUser);
    console.log('Current user role:', currentUser?.role);
    console.log('Requested role:', createUserDto.role);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (createUserDto.role && createUserDto.role !== UserRole.USER) {
      if (!currentUser) {
        throw new ForbiddenException(
          'Authentication required to create users with custom roles',
        );
      }

      if (
        createUserDto.role === UserRole.SUPER_ADMIN &&
        !this.isUserSuperAdmin(currentUser)
      ) {
        throw new ForbiddenException(
          'Only Super Admins can create other Super Admins',
        );
      }

      if (!this.isUserAdmin(currentUser)) {
        throw new ForbiddenException(
          'Only admins can create users with custom roles',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        status: createUserDto.status || UserStatus.PENDING,
      },
    });

    return this.mapToEntity(user);
  }

  async findAll(
    filters?: {
      status?: UserStatus;
      role?: UserRole;
      search?: string;
    },
    currentUser?: any,
  ): Promise<User[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (!this.isUserAdmin(currentUser)) {
      where.status = UserStatus.ACTIVE;
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.mapToEntity(u));
  }

  async findOne(id: string, currentUser?: any): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userEntity = this.mapToEntity(user);

    if (!userEntity.isActive() && !this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('Cannot view this user');
    }

    return userEntity;
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log('🔍 Buscando usuario por email:', email);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    console.log('🔍 Usuario encontrado:', user ? 'Sí' : 'No');
    if (user) {
      console.log('🔍 Password hash presente:', !!user.password);
      console.log(
        '🔍 Password hash (primeros 30 chars):',
        user.password?.substring(0, 30),
      );
      console.log('🔍 Status:', user.status);
    }

    return user ? this.mapToEntity(user) : null;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser?: any,
  ): Promise<User> {
    const user = await this.findOne(id, currentUser);

    if (currentUser?.id !== id && !this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (updateUserDto.role && !this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    if (updateUserDto.status && !this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can change user status');
    }

    const updateData: any = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return this.mapToEntity(updatedUser);
  }

  async remove(id: string, currentUser?: any): Promise<void> {
    await this.findOne(id, currentUser);

    if (!this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can delete users');
    }

    if (currentUser?.id === id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async activateUser(id: string, currentUser: any): Promise<User> {
    if (!this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can activate users');
    }

    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
    });

    return this.mapToEntity(user);
  }

  async suspendUser(id: string, currentUser: any): Promise<User> {
    if (!this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can suspend users');
    }

    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
    });

    return this.mapToEntity(user);
  }

  async getStats(currentUser?: any) {
    const isAdmin = this.isUserAdmin(currentUser);

    const where = isAdmin ? {} : { status: UserStatus.ACTIVE };

    const [total, active, pending, suspended] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.PENDING } }),
      this.prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
    ]);

    const roles = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    return {
      total,
      active,
      pending,
      suspended,
      roles: roles.map((r) => ({ role: r.role, count: r._count.role })),
      canViewAll: isAdmin,
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  private isUserAdmin(user: any): boolean {
    if (!user || !user.role) return false;
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  }

  private isUserSuperAdmin(user: any): boolean {
    if (!user || !user.role) return false;
    return user.role === UserRole.SUPER_ADMIN;
  }

  isSuperAdmin(user: User): boolean {
    return user.role === UserRole.SUPER_ADMIN;
  }

  private mapToEntity(user: any): User {
    const entity = new User();
    entity.id = user.id;
    entity.email = user.email;
    entity.firstName = user.firstName;
    entity.lastName = user.lastName;
    entity.password = user.password;
    entity.role = user.role as UserRole;
    entity.status = user.status as UserStatus;
    entity.avatarUrl = user.avatarUrl;
    entity.lastLoginAt = user.lastLoginAt;
    entity.githubId = user.githubId;
    entity.googleId = user.googleId;
    entity.emailVerified = user.emailVerified;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }
}
