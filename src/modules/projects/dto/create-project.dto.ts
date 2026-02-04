import {
  IsString,
  IsUrl,
  IsEnum,
  IsArray,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ProjectStatus, ProjectFramework } from '../entities/project.entity';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(10)
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  repositoryUrl?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsEnum(ProjectFramework)
  @IsOptional()
  framework?: ProjectFramework;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  databases?: string[];

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}