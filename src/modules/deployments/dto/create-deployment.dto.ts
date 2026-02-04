import {
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsNumber,
  MinLength,
} from 'class-validator';
import { DeploymentStatus, DeploymentEnvironment } from '../entities/deployment.entity';

export class CreateDeploymentDto {
  @IsString()
  @MinLength(7)
  commitHash: string;

  @IsString()
  @MinLength(1)
  commitMessage: string;

  @IsEnum(DeploymentStatus)
  @IsOptional()
  status?: DeploymentStatus;

  @IsEnum(DeploymentEnvironment)
  @IsOptional()
  environment?: DeploymentEnvironment;

  @IsString()
  @IsOptional()
  logs?: string;

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsNumber()
  @IsOptional()
  buildTime?: number;

  @IsString()
  projectId: string;
}