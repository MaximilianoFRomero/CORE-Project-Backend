import { Project } from '../../projects/entities/project.entity';

export enum DeploymentStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum DeploymentEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export class Deployment {
  id: string;
  commitHash: string;
  commitMessage: string;
  status: DeploymentStatus;
  environment: DeploymentEnvironment;
  logs: string;
  url: string;
  buildTime: number;
  projectId: string;
  project: Project;
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
