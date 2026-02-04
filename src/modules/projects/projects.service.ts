import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Project, ProjectFramework, ProjectStatus } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    try {
      const projectData = {
      name: createProjectDto.name,
      description: createProjectDto.description || '',
      repositoryUrl: createProjectDto.repositoryUrl || '',
      status: createProjectDto.status || ProjectStatus.ACTIVE,
      framework: createProjectDto.framework as ProjectFramework || ProjectFramework.NEXTJS,
      databases: createProjectDto.databases || ['postgresql'],
      isPrivate: createProjectDto.isPrivate || false,
    };

      return await this.projectsRepository.save(projectData);
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
      where.name = Like(`%${search}%`);
    }

    if (status) {
      where.status = status;
    }

    if (framework) {
      where.framework = framework;
    }

    if (startDate || endDate) {
      where.createdAt = Between(
        startDate || new Date(0),
        endDate || new Date(),
      );
    }

    return await this.projectsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['deployments'],
    });
  }

  async findActive(): Promise<Project[]> {
    return await this.projectsRepository.find({
      where: { status: ProjectStatus.ACTIVE },
      order: { createdAt: 'DESC' },
      relations: ['deployments'],
    });
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ['deployments'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id);

    Object.assign(project, updateProjectDto);
    project.updatedAt = new Date();

    return await this.projectsRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectsRepository.remove(project);
  }

  async getStats() {
    const [total, active, inactive, archived] = await Promise.all([
      this.projectsRepository.count(),
      this.projectsRepository.count({
        where: { status: ProjectStatus.ACTIVE },
      }),
      this.projectsRepository.count({
        where: { status: ProjectStatus.INACTIVE },
      }),
      this.projectsRepository.count({
        where: { status: ProjectStatus.ARCHIVED },
      }),
    ]);

    const frameworks = await this.projectsRepository
      .createQueryBuilder('project')
      .select('project.framework, COUNT(*) as count')
      .groupBy('project.framework')
      .getRawMany();

    return {
      total,
      active,
      inactive,
      archived,
      frameworks,
    };
  }

  async updateLastDeployedAt(projectId: string): Promise<void> {
    await this.projectsRepository.update(projectId, {
      lastDeployedAt: new Date(),
    });
  }

  async searchProjects(keyword: string): Promise<Project[]> {
    return await this.projectsRepository
      .createQueryBuilder('project')
      .where('project.name ILIKE :keyword', { keyword: `%${keyword}%` })
      .orWhere('project.description ILIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .getMany();
  }
}