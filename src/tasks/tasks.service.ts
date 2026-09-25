import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectRole } from 'src/common/enums/project-role.enum';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createTaskDto: CreateTaskDto,
    projectId: string,
    userId: string,
  ) {
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

    if (projectMember.role === ProjectRole.MEMBER) {
      throw new ForbiddenException(
        'You do not have permission to create tasks in this project',
      );
    }

    if (createTaskDto.assigneeId) {
      if (createTaskDto.assigneeId === userId) {
        throw new BadRequestException('You cannot assign tasks to yourself');
      }
      const assignee = await this.prisma.projectMembership.findUnique({
        where: {
          userId_projectId: {
            userId: createTaskDto.assigneeId,
            projectId,
          },
        },
      });

      if (!assignee) {
        throw new NotFoundException(
          'The assigned user is not a member of this project',
        );
      }

      if (
        projectMember.role === ProjectRole.MANAGER &&
        assignee.role !== ProjectRole.MEMBER
      ) {
        throw new ForbiddenException(
          'You do not have permission to assign tasks to managers or owners',
        );
      }
    }

    const dueDate = createTaskDto.dueDate
      ? new Date(createTaskDto.dueDate)
      : undefined;

    if (dueDate && dueDate < new Date()) {
      throw new BadRequestException('Due date must be in the future');
    }

    return await this.prisma.task.create({
      data: {
        ...createTaskDto,
        dueDate,
        projectId,
        createdById: userId,
      },
    });
  }

  async findAll(projectId: string, userId: string) {
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

    return this.prisma.task.findMany({
      where: {
        projectId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
        OR: [
          {
            createdById: userId,
          },
          {
            assigneeId: userId,
          },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  // update(id: string, updateTaskDto: UpdateTaskDto) {
  //   return;
  // }

  // remove(id: string) {
  //   return;
  // }
}
