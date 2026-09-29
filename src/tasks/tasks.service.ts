import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { TaskPriorityDto } from './dto/task-priority.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectRole } from 'src/common/enums/project-role.enum';
import { TaskStatus, TaskPriority } from 'src/common/enums/tasks.enum';
import { TaskStatusDto } from './dto/task-status.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createTaskDto: CreateTaskDto,
    projectId: string,
    userId: string,
  ) {
    const projectMember = await this.getProjectMembership(projectId, userId);

    if (projectMember.role === ProjectRole.MEMBER) {
      throw new ForbiddenException(
        'You do not have permission to create tasks in this project',
      );
    }

    if (createTaskDto.assigneeId && createTaskDto.assigneeId !== userId) {
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

    let dueDate: Date | null | undefined = undefined;
    if (createTaskDto.dueDate === null) {
      dueDate = null;
    } else if (createTaskDto.dueDate) {
      dueDate = new Date(createTaskDto.dueDate);
    }

    if (dueDate && dueDate < new Date()) {
      throw new BadRequestException('Due date must be in the future');
    }

    return await this.prisma.task.create({
      data: {
        title: createTaskDto.title.trim(),
        description: createTaskDto.description?.trim(),
        assigneeId: createTaskDto.assigneeId,
        priority: createTaskDto.priority,
        dueDate,
        projectId,
        createdById: userId,
      },
    });
  }

  async findAll(projectId: string, userId: string) {
    await this.getProjectMembership(projectId, userId);

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
        // OR: [
        //   {
        //     createdById: userId,
        //   },
        //   {
        //     assigneeId: userId,
        //   },
        // ],
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
      throw new NotFoundException('Task not found ');
    }

    await this.getProjectMembership(task.projectId, userId);

    return task;
  }

  async update(taskId: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const projectMember = await this.getProjectMembership(
      task.projectId,
      userId,
    );

    if (projectMember.role === ProjectRole.MEMBER) {
      throw new ForbiddenException(
        'You do not have permission to update tasks in this project',
      );
    }

    let dueDate: Date | null | undefined = undefined;
    if (updateTaskDto.dueDate === null) {
      dueDate = null;
    } else if (updateTaskDto.dueDate) {
      dueDate = new Date(updateTaskDto.dueDate);
    }

    if (dueDate && dueDate < new Date()) {
      throw new BadRequestException('Due date must be in the future');
    }

    return await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title: updateTaskDto.title,
        description: updateTaskDto.description,
        dueDate,
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

  async assignTask(
    taskId: string,
    assignTaskDto: AssignTaskDto,
    userId: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const projectMember = await this.getProjectMembership(
      task.projectId,
      userId,
    );

    if (projectMember.role === ProjectRole.MEMBER) {
      throw new ForbiddenException(
        'You do not have permission to assign tasks in this project',
      );
    }

    if (assignTaskDto.assigneeId !== userId) {
      const assignee = await this.prisma.projectMembership.findUnique({
        where: {
          userId_projectId: {
            userId: assignTaskDto.assigneeId,
            projectId: task.projectId,
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

    return await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        assigneeId: assignTaskDto.assigneeId,
        status: TaskStatus.TODO,
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

  async unassignTask(
    taskId: string,
    assignTaskDto: AssignTaskDto,
    userId: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const projectMember = await this.getProjectMembership(
      task.projectId,
      userId,
    );

    if (projectMember.role === ProjectRole.MEMBER) {
      throw new ForbiddenException(
        'You do not have permission to unassign tasks in this project',
      );
    }

    if (assignTaskDto.assigneeId !== userId) {
      const assignee = await this.prisma.projectMembership.findUnique({
        where: {
          userId_projectId: {
            userId: assignTaskDto.assigneeId,
            projectId: task.projectId,
          },
        },
      });

      if (!assignee) {
        throw new NotFoundException(
          'The unassigned user is not a member of this project',
        );
      }

      if (
        projectMember.role === ProjectRole.MANAGER &&
        assignee.role !== ProjectRole.MEMBER
      ) {
        throw new ForbiddenException(
          'You do not have permission to unassign tasks from managers or owners',
        );
      }
    }

    return await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        assigneeId: null,
        status: TaskStatus.TODO,
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

  async changeTaskPriority(
    taskId: string,
    taskPriorityDto: TaskPriorityDto,
    userId: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const projectMember = await this.getProjectMembership(
      task.projectId,
      userId,
    );

    if (projectMember.role === ProjectRole.MEMBER) {
      throw new ForbiddenException(
        'You do not have permission to change task priority in this project',
      );
    }

    return await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        priority: taskPriorityDto.priority,
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

  async changeTaskStatus(
    taskId: string,
    taskStatusDto: TaskStatusDto,
    userId: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const projectMember = await this.getProjectMembership(
      task.projectId,
      userId,
    );

    if (
      projectMember.role === ProjectRole.MEMBER &&
      task.assigneeId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to change this task status.',
      );
    }

    return await this.prisma.task.update({
      where: { id: taskId },
      data: { status: taskStatusDto.status },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // remove(id: string) {
  //   return;j
  // }

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
}
