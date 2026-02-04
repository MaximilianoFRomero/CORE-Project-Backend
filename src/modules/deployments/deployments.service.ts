import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Deployment, DeploymentStatus } from './entities/deployment.entity';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class DeploymentsService {
  constructor(
    @InjectRepository(Deployment)
    private deploymentsRepository: Repository<Deployment>,
    private projectsService: ProjectsService,
  ) {}

async create(createDeploymentDto: CreateDeploymentDto): Promise<Deployment> {
  const project = await this.projectsService.findOne(
    createDeploymentDto.projectId,
  );

  const deployment = this.deploymentsRepository.create({
    ...createDeploymentDto,
    project,
  });

  const savedDeployment = await this.deploymentsRepository.save(deployment);
  
  await this.projectsService.updateLastDeployedAt(project.id);
  
  return savedDeployment;
}

  async findAll(
    projectId?: string,
    environment?: string,
    status?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Deployment[]> {
    const where: any = {};

    if (projectId) {
      where.project = { id: projectId };
    }

    if (environment) {
      where.environment = environment;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = Between(startDate || new Date(0), endDate || new Date());
    }

    return await this.deploymentsRepository.find({
      where,
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Deployment> {
    const deployment = await this.deploymentsRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment with ID ${id} not found`);
    }

    return deployment;
  }

  async update(
    id: string,
    updateDeploymentDto: UpdateDeploymentDto,
  ): Promise<Deployment> {
    const deployment = await this.findOne(id);

    if (
      updateDeploymentDto.status === DeploymentStatus.SUCCESS ||
      updateDeploymentDto.status === DeploymentStatus.FAILED
    ) {
      updateDeploymentDto['completedAt'] = new Date();
    }

    if (updateDeploymentDto.status === DeploymentStatus.RUNNING) {
      updateDeploymentDto['startedAt'] = new Date();
    }

    Object.assign(deployment, updateDeploymentDto);
    deployment.updatedAt = new Date();

    return await this.deploymentsRepository.save(deployment);
  }

  async remove(id: string): Promise<void> {
    const deployment = await this.findOne(id);
    await this.deploymentsRepository.remove(deployment);
  }

  async getDeploymentStats(projectId?: string) {
    const where: any = {};
    if (projectId) {
      where.project = { id: projectId };
    }

    const [total, success, failed, running, pending] = await Promise.all([
      this.deploymentsRepository.count({ where }),
      this.deploymentsRepository.count({
        where: { ...where, status: DeploymentStatus.SUCCESS },
      }),
      this.deploymentsRepository.count({
        where: { ...where, status: DeploymentStatus.FAILED },
      }),
      this.deploymentsRepository.count({
        where: { ...where, status: DeploymentStatus.RUNNING },
      }),
      this.deploymentsRepository.count({
        where: { ...where, status: DeploymentStatus.PENDING },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDeployments = await this.deploymentsRepository.count({
      where: {
        ...where,
        createdAt: Between(today, tomorrow),
      },
    });

    return {
      total,
      success,
      failed,
      running,
      pending,
      today: todayDeployments,
      successRate: total > 0 ? (success / total) * 100 : 0,
    };
  }

  async getDeploymentsByDateRange(
    startDate: Date,
    endDate: Date,
    projectId?: string,
  ) {
    const where: any = {
      createdAt: Between(startDate, endDate),
    };

    if (projectId) {
      where.project = { id: projectId };
    }

    return await this.deploymentsRepository.find({
      where,
      relations: ['project'],
      order: { createdAt: 'ASC' },
    });
  }
}