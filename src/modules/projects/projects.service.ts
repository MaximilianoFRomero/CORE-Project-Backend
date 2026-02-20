import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import {
  Project,
  ProjectFramework,
  ProjectStatus,
  ProjectDatabase,
} from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    try {
      const databases = createProjectDto.databases || [ProjectDatabase.POSTGRESQL];
      
      const project = await this.prisma.project.create({
        data: {
          name: createProjectDto.name,
          description: createProjectDto.description || '',
          repositoryUrl: createProjectDto.repositoryUrl || '',
          status: (this.toPrismaStatus(createProjectDto.status) || 'active') as any,
          framework: (this.toPrismaFramework(createProjectDto.framework) || 'nextjs') as any,
          databases: this.databasesToString(databases) as any,
          isPrivate: createProjectDto.isPrivate || false,
        },
        include: { deployments: true },
      });

      return this.mapToEntity(project);
    } catch (error) {
      throw new BadRequestException('Error creating project');
    }
  }

  async findAll(
    search?: string,
    status?: ProjectStatus,
    framework?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Project[]> {
    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      where.status = this.toPrismaStatus(status);
    }

    if (framework) {
      where.framework = this.toPrismaFramework(framework);
    }

    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate || new Date(0),
        lte: endDate || new Date(),
      };
    }

    const projects = await this.prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { deployments: true },
    });

    return projects.map((p) => this.mapToEntity(p));
  }

  async findActive(): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: { deployments: true },
    });

    return projects.map((p) => this.mapToEntity(p));
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { deployments: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return this.mapToEntity(project);
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    await this.findOne(id);

    const updateData: any = {
      ...updateProjectDto,
      updatedAt: new Date(),
    };

    if (updateProjectDto.status) {
      updateData.status = this.toPrismaStatus(updateProjectDto.status);
    }

    if (updateProjectDto.framework) {
      updateData.framework = this.toPrismaFramework(updateProjectDto.framework);
    }

    if (updateProjectDto.databases) {
      updateData.databases = this.databasesToString(updateProjectDto.databases);
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: { deployments: true },
    });

    return this.mapToEntity(project);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.project.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, active, inactive, archived] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({
        where: { status: 'active' },
      }),
      this.prisma.project.count({
        where: { status: 'inactive' },
      }),
      this.prisma.project.count({
        where: { status: 'archived' },
      }),
    ]);

    const frameworks = await this.prisma.project.groupBy({
      by: ['framework'],
      _count: {
        framework: true,
      },
    });

    return {
      total,
      active,
      inactive,
      archived,
      frameworks: frameworks.map((f) => ({
        framework: f.framework,
        count: f._count.framework,
      })),
    };
  }

  async updateLastDeployedAt(projectId: string): Promise<void> {
    await this.prisma.project.update({
      where: { id: projectId },
      data: { lastDeployedAt: new Date() },
    });
  }

  async searchProjects(keyword: string): Promise<Project[]> {
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      },
    });

    return projects.map((p) => this.mapToEntity(p));
  }

  private toPrismaStatus(status: ProjectStatus | string | undefined): string | undefined {
    if (!status) return undefined;
    return status.toLowerCase();
  }

  private toPrismaFramework(framework: string | undefined): string | undefined {
    if (!framework) return undefined;
    return framework.toLowerCase();
  }

  private databasesToString(databases: string[]): string {
    return databases.join(',');
  }

  private stringToDatabases(databases: string): string[] {
    if (!databases) return [];
    return databases.split(',').filter(Boolean);
  }

  private mapToEntity(project: any): Project {
    const entity = new Project();
    entity.id = project.id;
    entity.name = project.name;
    entity.description = project.description;
    entity.repositoryUrl = project.repositoryUrl;
    entity.status = project.status as ProjectStatus;
    entity.framework = project.framework as ProjectFramework;
    entity.databases = this.stringToDatabases(project.databases);
    entity.isPrivate = project.isPrivate;
    entity.lastDeployedAt = project.lastDeployedAt;
    entity.createdAt = project.createdAt;
    entity.updatedAt = project.updatedAt;
    entity.deployments = project.deployments;
    return entity;
  }
}
