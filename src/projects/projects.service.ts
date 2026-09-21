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
    return await this.prisma.$transaction(async (tx) => {
      // 1. create new project
      const project = await tx.project.create({
        data: {
          name: createProjectDto.name,
          description: createProjectDto.description,
        },
      });

      // 2. create new project membership for the owner
      const membership = await tx.projectMembership.create({
        data: {
          projectId: project.id,
          userId: ownerId,
          role: ProjectRole.OWNER,
        },
      });

      return { project, membership };
    });
  }

  async findAll(userId: string) {
    return await this.prisma.projectMembership.findMany({
      where: {
        userId,
      },
      select: {
        project: true,
        role: true,
      },
    });
  }

  async findOne(projectId: string, userId: string) {
    const membership = await this.getMembership(projectId, userId);

    return membership.project;
  }

  async update(
    projectId: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ) {
    // check if user is authorized to access this project
    const membership = await this.getMembership(projectId, userId);

    // check if user is authorized to update this project
    this.assertOwner(membership.role);

    // update project
    return await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: updateProjectDto,
    });
  }

  async remove(projectId: string, userId: string) {
    // check if user is authorized to access this project
    const membership = await this.getMembership(projectId, userId);

    // check if user is authorized to remove this project
    this.assertOwner(membership.role);

    // remove project
    return await this.prisma.project.delete({
      where: {
        id: projectId,
      },
    });
  }

  private async getMembership(projectId: string, userId: string) {
    const membership = await this.prisma.projectMembership.findFirst({
      where: {
        projectId,
        userId,
      },
      include: {
        project: true,
      },
    });

    if (!membership) {
      throw new NotFoundException(`Project membership not found`);
    }

    return membership;
  }

  private assertOwner(role: ProjectRole) {
    if (role !== ProjectRole.OWNER) {
      throw new ForbiddenException(
        `You are not authorized to perform this action`,
      );
    }
  }
}
