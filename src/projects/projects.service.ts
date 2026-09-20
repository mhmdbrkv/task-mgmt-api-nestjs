import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findMyProjects(userId: string) {
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

  async findOne(projectId: string) {
    return `This action returns a #${projectId} project`;
  }

  async update(projectId: string, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${projectId} project`;
  }

  async remove(projectId: string) {
    return `This action removes a #${projectId} project`;
  }
}
