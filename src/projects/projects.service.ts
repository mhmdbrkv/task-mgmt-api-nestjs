import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectRole } from 'src/common/enums/project-role.enum';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, ownerId: string) {
    // start transaction
    const newProject = await this.prisma.$transaction(async (tx) => {
      // 1. create new project
      const project = await tx.project.create({
        data: {
          name: createProjectDto.name,
          description: createProjectDto.description,
        },
      });

      // 2. create new project membership for the owner
      const projectMembership = await tx.projectMembership.create({
        data: {
          projectId: project.id,
          userId: ownerId,
          role: ProjectRole.OWNER,
        },
      });

      return { project, projectMembership };
    });

    return newProject;
  }

  async findAll(userId: string) {
    const projects = await this.prisma.projectMembership.findMany({
      where: {
        userId,
      },
      select: {
        project: true,
        role: true,
      },
    });

    return projects;
  }

  async findOne(projectId: string, userId: string) {
    // fetch one project
    const project = await this.prisma.projectMembership.findFirst({
      where: {
        projectId,
        userId,
      },
      include: {
        project: true,
      },
    });
    // if project not found
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    return project;
  }

  async update(
    projectId: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ) {
    // check if user is authorized to access this project
    const projectMembership = await this.prisma.projectMembership.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!projectMembership) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    // check if user is authorized to update this project
    if (projectMembership.role !== ProjectRole.OWNER) {
      throw new ForbiddenException(
        `You are not authorized to update this project`,
      );
    }

    // update project
    const updatedProject = await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: updateProjectDto,
    });

    return updatedProject;
  }

  async remove(projectId: string, userId: string) {
    // check if user is authorized to access this project
    const projectMembership = await this.prisma.projectMembership.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!projectMembership) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    // check if user is authorized to remove this project
    if (projectMembership.role !== ProjectRole.OWNER) {
      throw new ForbiddenException(
        `You are not authorized to remove this project`,
      );
    }

    // remove project
    const removedProject = await this.prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return removedProject;
  }
}
