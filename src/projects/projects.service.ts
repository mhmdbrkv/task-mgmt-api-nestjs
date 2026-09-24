import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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

    if (!membership) {
      throw new NotFoundException('Project not found');
    }

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
    if (membership && !this.isOwner(membership.role)) {
      throw new ForbiddenException(
        'You are not authorized to update this project',
      );
    }

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

    // check if user is authorized to update this project
    if (membership && !this.isOwner(membership.role)) {
      throw new ForbiddenException(
        'You are not authorized to update this project',
      );
    }
    // remove project
    return await this.prisma.project.delete({
      where: {
        id: projectId,
      },
    });
  }

  async transferOwnership(
    projectId: string,
    ownerId: string,
    newOwnerId: string,
  ) {
    if (newOwnerId === ownerId) {
      throw new BadRequestException(
        'New owner must be different from the current owner',
      );
    }

    // check if user is authorized to access this project
    const membership = await this.getMembership(projectId, ownerId);

    // check if user is authorized to update this project
    if (!membership || !this.isOwner(membership.role)) {
      throw new ForbiddenException(
        'You are not authorized to update this project',
      );
    }

    // check if newOwnerId is already a member of this project
    const newOwnerMembership = await this.prisma.projectMembership.findFirst({
      where: {
        projectId,
        userId: newOwnerId,
      },
    });

    if (!newOwnerMembership) {
      throw new BadRequestException(
        'New owner must be a member of this project',
      );
    }

    // transfer ownership
    return this.prisma.$transaction(async (tx) => {
      // update old owner role to manager
      await tx.projectMembership.update({
        where: {
          id: membership.id,
        },
        data: {
          role: ProjectRole.MANAGER,
        },
      });

      // update new owner role to owner
      await tx.projectMembership.update({
        where: {
          id: newOwnerMembership.id,
        },
        data: {
          role: ProjectRole.OWNER,
        },
      });

      // return updated project
      return await tx.project.findUnique({
        where: {
          id: projectId,
        },
      });
    });
  }

  async getProjectMembers(projectId: string, userId: string) {
    // check if user is authorized to access this project
    const membership = await this.getMembership(projectId, userId);

    if (!membership) {
      throw new UnauthorizedException(
        'You are not authorized to access this project',
      );
    }

    // return all members of the project
    return await this.prisma.projectMembership.findMany({
      where: {
        projectId,
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        role: true,
      },
    });
  }

  async promoteProjectMember(
    projectId: string,
    userId: string,
    memberId: string,
  ) {
    // check if user is authorized to access this project
    const membership = await this.getMembership(projectId, userId);

    if (!membership) {
      throw new BadRequestException('You are not a member of this project');
    }

    if (membership.role === ProjectRole.MEMBER) {
      throw new ForbiddenException(
        'You are not authorized to perform this action',
      );
    }

    if (memberId === userId) {
      throw new BadRequestException('You cannot promote yourself');
    }

    // check if memberId is a member of this project
    const memberMembership = await this.getMembership(projectId, memberId);
    if (!memberMembership) {
      throw new BadRequestException('Member must be a member of this project');
    }

    if (memberMembership.role !== ProjectRole.MEMBER) {
      throw new BadRequestException(
        'Cannot promote a user who is already a manager or owner',
      );
    }

    // promote member
    return this.prisma.projectMembership.update({
      where: {
        id: memberMembership.id,
      },
      data: {
        role: ProjectRole.MANAGER,
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
      return null;
    }

    return membership;
  }

  private isOwner(role: ProjectRole) {
    return role === ProjectRole.OWNER;
  }
}
