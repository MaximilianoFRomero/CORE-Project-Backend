import { 
  IsEmail, 
  IsString, 
  IsOptional, 
  MinLength, 
  MaxLength,
  Matches,
  ValidateIf
} from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class CreateAdminUserDto {
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