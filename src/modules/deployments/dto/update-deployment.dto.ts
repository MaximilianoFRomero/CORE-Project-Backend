import { PartialType } from '@nestjs/mapped-types';
import { CreateDeploymentDto } from './create-deployment.dto';

export class UpdateDeploymentDto extends PartialType(CreateDeploymentDto) {}