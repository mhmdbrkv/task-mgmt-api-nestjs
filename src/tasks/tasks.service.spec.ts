import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectRole } from '../common/enums/project-role.enum';

describe('TasksService', () => {
  let service: TasksService;
  const prisma = {
    task: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    projectMembership: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('remove', () => {
    it('deletes a task for a project manager', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
      prisma.projectMembership.findUnique.mockResolvedValue({
        role: ProjectRole.MANAGER,
      });
      prisma.task.delete.mockResolvedValue({ id: 'task-1' });

      await service.remove('task-1', 'manager-1');

      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
    });

    it('rejects a member trying to delete a task', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: 'task-1', projectId: 'project-1' });
      prisma.projectMembership.findUnique.mockResolvedValue({
        role: ProjectRole.MEMBER,
      });

      await expect(service.remove('task-1', 'member-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it('returns not found for a missing task', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing', 'owner-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });
  });
});
