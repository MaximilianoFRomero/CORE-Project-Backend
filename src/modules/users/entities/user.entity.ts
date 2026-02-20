import * as bcrypt from 'bcrypt';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export class User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  lastLoginAt?: Date;
  githubId?: string;
  googleId?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
  }

  isSuperAdmin(): boolean {
    return this.role === UserRole.SUPER_ADMIN;
  }
}
