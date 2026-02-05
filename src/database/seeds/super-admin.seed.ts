import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminSeed {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async seed() {
    const superAdminEmail = 'superadmin@core.com';
    
    const existingSuperAdmin = await this.usersRepository.findOne({
      where: { email: superAdminEmail },
    });

    if (!existingSuperAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('SuperAdmin123!', salt);

      const superAdmin = this.usersRepository.create({
        email: superAdminEmail,
        firstName: 'Super',
        lastName: 'Admin',
        password: passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });

      await this.usersRepository.save(superAdmin);
      console.log('✅ Super Admin created:', superAdminEmail);
    } else {
      console.log('✅ Super Admin already exists');
    }
  }
}