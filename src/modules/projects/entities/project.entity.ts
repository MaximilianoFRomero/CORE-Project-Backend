import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
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

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  repositoryUrl: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @Column({
    type: 'enum',
    enum: ProjectFramework,
    default: ProjectFramework.NEXTJS,
  })
  framework: ProjectFramework;

  @Column({ type: 'simple-array', default: ProjectDatabase.POSTGRESQL })
  databases: string[];

  @Column({ type: 'boolean', default: false })
  isPrivate: boolean;

  @OneToMany(() => Deployment, (deployment) => deployment.project)
  deployments: Deployment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastDeployedAt: Date;
}