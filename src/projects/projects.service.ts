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
    targetUserId: string,
  ) {
    const ownerMembership = await this.getMembership(projectId, userId);

    if (!ownerMembership) {
      throw new BadRequestException('You are not a member of this project');
    }

    if (!this.isOwner(ownerMembership.role)) {
      throw new ForbiddenException(
        'You are not authorized to perform this action',
      );
    }

    if (targetUserId === userId) {
      throw new BadRequestException('You cannot promote yourself');
    }

    const targetMembership = await this.getMembership(projectId, targetUserId);

    if (!targetMembership) {
      throw new BadRequestException(
        'Target user must be a member of the project',
      );
    }

    if (!this.isMember(targetMembership.role)) {
      throw new BadRequestException('Only project members can be promoted');
    }

    return this.prisma.projectMembership.update({
      where: {
        id: targetMembership.id,
      },
      data: {
        role: ProjectRole.MANAGER,
      },
    });
  }

  async demoteProjectManager(
    projectId: string,
    userId: string,
    targetUserId: string,
  ) {
    const ownerMembership = await this.getMembership(projectId, userId);

    if (!ownerMembership) {
      throw new BadRequestException('You are not a member of this project');
    }

    if (!this.isOwner(ownerMembership.role)) {
      throw new ForbiddenException(
        'You are not authorized to perform this action',
      );
    }

    if (targetUserId === userId) {
      throw new BadRequestException('You cannot demote yourself');
    }

    const targetMembership = await this.getMembership(projectId, targetUserId);

    if (!targetMembership) {
      throw new BadRequestException(
        'Target user must be a member of the project',
      );
    }

    if (!this.isManager(targetMembership.role)) {
      throw new BadRequestException('Only project managers can be demoted');
    }

    return this.prisma.projectMembership.update({
      where: {
        id: targetMembership.id,
      },
      data: {
        role: ProjectRole.MEMBER,
      },
    });
  }

  private getMembership(projectId: string, userId: string) {
    return this.prisma.projectMembership.findFirst({
      where: {
        projectId,
        userId,
      },
      include: {
        project: true,
      },
    });
  }

  private isOwner(role: ProjectRole) {
    return role === ProjectRole.OWNER;
  }

  private isManager(role: ProjectRole) {
    return role === ProjectRole.MANAGER;
  }

  private isMember(role: ProjectRole) {
    return role === ProjectRole.MEMBER;
  }
}
