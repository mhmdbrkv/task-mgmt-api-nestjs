import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectRole } from '../common/enums/project-role.enum';

describe('ProjectsService', () => {
  let service: ProjectsService;
  const transaction = {
    task: {
      updateMany: jest.fn(),
    },
    projectMembership: {
      delete: jest.fn(),
    },
  };
  const prisma = {
    projectMembership: {
      findFirst: jest.fn(),
    },
    project: {
      delete: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('remove', () => {
    it('deletes a project for its owner', async () => {
      prisma.projectMembership.findFirst.mockResolvedValue({
        role: ProjectRole.OWNER,
      });
      prisma.project.delete.mockResolvedValue({ id: 'project-1' });

      await service.remove('project-1', 'owner-1');

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'project-1' },
      });
    });

    it.each([null, { role: ProjectRole.MANAGER }])(
      'rejects deletion when the requester is not the project owner',
      async (membership) => {
        prisma.projectMembership.findFirst.mockResolvedValue(membership);

        await expect(
          service.remove('project-1', 'not-owner'),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(prisma.project.delete).not.toHaveBeenCalled();
      },
    );
  });

  describe('removeProjectMember', () => {
    it('allows the owner to remove a non-owner member and unassigns their tasks', async () => {
      prisma.projectMembership.findFirst
        .mockResolvedValueOnce({ id: 'owner-membership', role: ProjectRole.OWNER })
        .mockResolvedValueOnce({ id: 'member-membership', role: ProjectRole.MEMBER });

      await service.removeProjectMember('project-1', 'owner-1', 'member-1');

      expect(transaction.task.updateMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1', assigneeId: 'member-1' },
        data: { assigneeId: null, status: 'TODO' },
      });
      expect(transaction.projectMembership.delete).toHaveBeenCalledWith({
        where: { id: 'member-membership' },
      });
    });
  });

  describe('leaveProject', () => {
    it('does not allow the owner to leave before transferring ownership', async () => {
      prisma.projectMembership.findFirst.mockResolvedValue({
        id: 'owner-membership',
        role: ProjectRole.OWNER,
      });

      await expect(
        service.leaveProject('project-1', 'owner-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
