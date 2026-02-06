import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, currentUser?: any): Promise<User> {
    console.log('=== USERS SERVICE CREATE ===');
    console.log('Current user:', currentUser);
    console.log('Current user role:', currentUser?.role);
    console.log('Requested role:', createUserDto.role);

    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (createUserDto.role && createUserDto.role !== UserRole.USER) {
      if (!currentUser) {
        throw new ForbiddenException('Authentication required to create users with custom roles');
      }
      
      if (createUserDto.role === UserRole.SUPER_ADMIN && !this.isUserSuperAdmin(currentUser)) {
        throw new ForbiddenException('Only Super Admins can create other Super Admins');
      }
      
      if (!this.isUserAdmin(currentUser)) {
        throw new ForbiddenException('Only admins can create users with custom roles');
      }
    }

    const user = this.usersRepository.create(createUserDto);
    
    if (!user.status) {
      user.status = UserStatus.PENDING;
    }

    return await this.usersRepository.save(user);
  }

  async findAll(
    filters?: {
      status?: UserStatus;
      role?: UserRole;
      search?: string;
    },
    currentUser?: any,
  ): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (filters?.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.search) {
      query.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (!this.isUserAdmin(currentUser)) {
      query.andWhere('user.status = :activeStatus', { activeStatus: UserStatus.ACTIVE });
    }

    return await query.orderBy('user.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, currentUser?: any): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (!user.isActive() && !this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('Cannot view this user');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log('🔍 Buscando usuario por email:', email);
    
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
    
    console.log('🔍 Usuario encontrado:', user ? 'Sí' : 'No');
    if (user) {
      console.log('🔍 Password hash presente:', !!user.password);
      console.log('🔍 Password hash (primeros 30 chars):', user.password?.substring(0, 30));
      console.log('🔍 Status:', user.status);
    }
    
    return user;
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

    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async remove(id: string, currentUser?: any): Promise<void> {
    const user = await this.findOne(id, currentUser);

    if (!this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can delete users');
    }

    if (currentUser?.id === id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    await this.usersRepository.remove(user);
  }

  async activateUser(id: string, currentUser: any): Promise<User> {
    if (!this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can activate users');
    }

    const user = await this.findOne(id);
    user.status = UserStatus.ACTIVE;
    return await this.usersRepository.save(user);
  }

  async suspendUser(id: string, currentUser: any): Promise<User> {
    if (!this.isUserAdmin(currentUser)) {
      throw new ForbiddenException('Only admins can suspend users');
    }

    const user = await this.findOne(id);
    user.status = UserStatus.SUSPENDED;
    return await this.usersRepository.save(user);
  }

  async getStats(currentUser?: any) {
    const isAdmin = this.isUserAdmin(currentUser);

    const query = this.usersRepository.createQueryBuilder('user');
    
    if (!isAdmin) {
      query.where('user.status = :status', { status: UserStatus.ACTIVE });
    }

    const [total, active, pending, suspended] = await Promise.all([
      query.getCount(),
      this.usersRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.usersRepository.count({ where: { status: UserStatus.PENDING } }),
      this.usersRepository.count({ where: { status: UserStatus.SUSPENDED } }),
    ]);

    const roles = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.role, COUNT(*) as count')
      .groupBy('user.role')
      .getRawMany();

    return {
      total,
      active,
      pending,
      suspended,
      roles,
      canViewAll: isAdmin,
    };
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
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
}