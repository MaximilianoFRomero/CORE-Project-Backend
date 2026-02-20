import { Deployment } from '../../deployments/entities/deployment.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum ProjectFramework {
  NEXTJS = 'nextjs',
  NESTJS = 'nestjs',
  EXPRESS = 'express',
  REACT = 'react',
  VUE = 'vue',
  ANGULAR = 'angular',
}

export enum ProjectDatabase {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
  REDIS = 'redis',
}

export class Project {
  id: string;
  name: string;
  description: string;
  repositoryUrl: string;
  status: ProjectStatus;
  framework: ProjectFramework;
  databases: string[];
  isPrivate: boolean;
  deployments: Deployment[];
  createdAt: Date;
  updatedAt: Date;
  lastDeployedAt: Date;
}
