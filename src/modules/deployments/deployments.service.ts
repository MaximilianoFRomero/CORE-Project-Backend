import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  Deployment,
  DeploymentStatus,
  DeploymentEnvironment,
} from './entities/deployment.entity';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class DeploymentsService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
  ) {}

  async create(createDeploymentDto: CreateDeploymentDto): Promise<Deployment> {
    const project = await this.projectsService.findOne(
      createDeploymentDto.projectId,
    );

    const deployment = await this.prisma.deployment.create({
      data: {
        ...createDeploymentDto,
        environment:
          (createDeploymentDto.environment as DeploymentEnvironment) ||
          DeploymentEnvironment.DEVELOPMENT,
        status:
          (createDeploymentDto.status as DeploymentStatus) ||
          DeploymentStatus.PENDING,
      },
      include: { project: true },
    });

    await this.projectsService.updateLastDeployedAt(project.id);

    return this.mapToEntity(deployment);
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
      where.projectId = projectId;
    }

    if (environment) {
      where.environment = environment;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate || new Date(0),
        lte: endDate || new Date(),
      };
    }

    const deployments = await this.prisma.deployment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { project: true },
    });

    return deployments.map((d) => this.mapToEntity(d));
  }

  async findOne(id: string): Promise<Deployment> {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment with ID ${id} not found`);
    }

    return this.mapToEntity(deployment);
  }

  async update(
    id: string,
    updateDeploymentDto: UpdateDeploymentDto,
  ): Promise<Deployment> {
    await this.findOne(id);

    const updateData: any = { ...updateDeploymentDto };

    if (
      updateDeploymentDto.status === DeploymentStatus.SUCCESS ||
      updateDeploymentDto.status === DeploymentStatus.FAILED
    ) {
      updateData.completedAt = new Date();
    }

    if (updateDeploymentDto.status === DeploymentStatus.RUNNING) {
      updateData.startedAt = new Date();
    }

    updateData.updatedAt = new Date();

    const deployment = await this.prisma.deployment.update({
      where: { id },
      data: updateData,
      include: { project: true },
    });

    return this.mapToEntity(deployment);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.deployment.delete({
      where: { id },
    });
  }

  async getDeploymentStats(projectId?: string) {
    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    const [total, success, failed, running, pending] = await Promise.all([
      this.prisma.deployment.count({ where }),
      this.prisma.deployment.count({
        where: { ...where, status: DeploymentStatus.SUCCESS },
      }),
      this.prisma.deployment.count({
        where: { ...where, status: DeploymentStatus.FAILED },
      }),
      this.prisma.deployment.count({
        where: { ...where, status: DeploymentStatus.RUNNING },
      }),
      this.prisma.deployment.count({
        where: { ...where, status: DeploymentStatus.PENDING },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDeployments = await this.prisma.deployment.count({
      where: {
        ...where,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
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
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    const deployments = await this.prisma.deployment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { project: true },
    });

    return deployments.map((d) => this.mapToEntity(d));
  }

  private mapToEntity(deployment: any): Deployment {
    const entity = new Deployment();
    entity.id = deployment.id;
    entity.commitHash = deployment.commitHash;
    entity.commitMessage = deployment.commitMessage;
    entity.status = deployment.status as DeploymentStatus;
    entity.environment = deployment.environment as DeploymentEnvironment;
    entity.logs = deployment.logs;
    entity.url = deployment.url;
    entity.buildTime = deployment.buildTime;
    entity.projectId = deployment.projectId;
    entity.startedAt = deployment.startedAt;
    entity.completedAt = deployment.completedAt;
    entity.createdAt = deployment.createdAt;
    entity.updatedAt = deployment.updatedAt;
    entity.project = deployment.project;
    return entity;
  }
}
