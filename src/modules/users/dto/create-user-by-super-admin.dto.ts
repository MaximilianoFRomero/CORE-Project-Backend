import { 
  IsEmail, 
  IsString, 
  IsOptional, 
  MinLength, 
  MaxLength,
  Matches,
  IsEnum,
  ValidateIf
} from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class CreateUserBySuperAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.USER;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus = UserStatus.ACTIVE;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @ValidateIf((o) => !o.generatePassword || o.generatePassword === false)
  password?: string;

  @IsOptional()
  generatePassword?: boolean = false;

  @IsOptional()
  avatarUrl?: string;
}