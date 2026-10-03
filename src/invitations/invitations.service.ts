import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';

import { PrismaService } from '../prisma/prisma.service';
import { ProjectRole } from '../common/enums/project-role.enum';
import { InvitationStatus } from '../common/enums/invitations.enum';
import { Invitation } from 'generated/prisma/browser';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    projectId: string,
    createInvitationDto: CreateInvitationDto,
    userId: string,
  ) {
    if (userId === createInvitationDto.inviteeId) {
      throw new BadRequestException('You cannot invite yourself');
    }

    //check if the user is authorized to invite members to this project
    const projectMembership = await this.getProjectMembership(
      projectId,
      userId,
    );

    if (!this.isOwner(projectMembership.role)) {
      throw new ForbiddenException(
        'You are not authorized to invite members to this project',
      );
    }

    const invitee = await this.prisma.user.findUnique({
      where: {
        id: createInvitationDto.inviteeId,
      },
    });

    if (!invitee) {
      throw new NotFoundException('Invitee not found');
    }

    //check if invitee is already a member
    const isMember = await this.prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId: createInvitationDto.inviteeId,
          projectId,
        },
      },
    });

    if (isMember) {
      throw new BadRequestException(
        'Invitee is already a member of this project',
      );
    }

    //check if there is an existing invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        inviteeId: createInvitationDto.inviteeId,
        projectId,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      throw new BadRequestException(
        'Invitee is already invited to this project',
      );
    }

    // validate expiration date
    const DEFAULT_EXPIRATION_DAYS = 7;
    const expiresAt = createInvitationDto.expiresAt
      ? new Date(createInvitationDto.expiresAt)
      : new Date(Date.now() + DEFAULT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

    if (expiresAt <= new Date()) {
      throw new BadRequestException(
        'Invitation expiration date must be in the future',
      );
    }

    return await this.prisma.invitation.create({
      data: {
        inviterId: userId,
        projectId,
        inviteeId: createInvitationDto.inviteeId,
        role: createInvitationDto.role,
        expiresAt,
      },
    });
  }

  async getProjectInvitations(projectId: string, userId: string) {
    const projectMember = await this.getProjectMembership(projectId, userId);

    if (!this.isOwner(projectMember.role)) {
      throw new ForbiddenException(
        'You are not authorized to get invitations for this project',
      );
    }

    return await this.prisma.invitation.findMany({
      where: {
        projectId,
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invitee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async getReceivedInvitations(userId: string) {
    return await this.prisma.invitation.findMany({
      where: {
        inviteeId: userId,
        // status: InvitationStatus.PENDING,
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invitee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.inviteeId !== userId) {
      const projectMembership = await this.getProjectMembership(
        invitation.projectId,
        userId,
      );

      if (!this.isOwner(projectMembership.role)) {
        throw new ForbiddenException(
          'You are not authorized to get this invitation',
        );
      }
    }

    return invitation;
  }

  async cancel(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const projectMember = await this.getProjectMembership(
      invitation.projectId,
      userId,
    );

    if (!this.isOwner(projectMember.role)) {
      throw new ForbiddenException(
        'You are not authorized to cancel this invitation',
      );
    }

    await this.assertInvitationPending(invitation);

    return await this.prisma.invitation.update({
      where: {
        id: invitationId,
      },
      data: {
        status: InvitationStatus.CANCELLED,
      },
    });
  }

  async accept(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to accept this invitation',
      );
    }

    await this.assertInvitationPending(invitation);

    try {
      const acceptInvitationTransaction = await this.prisma.$transaction(
        async (tx) => {
          // add user to project
          const projectMembership = await tx.projectMembership.create({
            data: {
              userId,
              projectId: invitation.projectId,
              role: invitation.role,
            },
          });

          // update invitation status
          const updatedInvitation = await tx.invitation.update({
            where: {
              id: invitationId,
            },
            data: {
              status: InvitationStatus.ACCEPTED,
            },
          });

          return { projectMembership, updatedInvitation };
        },
      );

      return acceptInvitationTransaction;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You are already a member of this project');
      }

      throw error;
    }
  }

  async reject(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: {
        id: invitationId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to reject this invitation',
      );
    }

    await this.assertInvitationPending(invitation);

    return await this.prisma.invitation.update({
      where: {
        id: invitationId,
      },
      data: {
        status: InvitationStatus.REJECTED,
      },
    });
  }

  private async getProjectMembership(projectId: string, userId: string) {
    const projectMember = await this.prisma.projectMembership.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    if (!projectMember) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return projectMember;
  }

  private isOwner(role: ProjectRole) {
    return role === ProjectRole.OWNER;
  }

  private async assertInvitationPending(invitation: Invitation) {
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'You can only perform this action on pending invitations',
      );
    }

    if (invitation.expiresAt <= new Date()) {
      await this.prisma.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: InvitationStatus.EXPIRED,
        },
      });

      throw new BadRequestException('Invitation has expired');
    }
  }
}
