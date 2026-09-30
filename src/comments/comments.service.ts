import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectRole } from 'generated/prisma/enums';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    taskId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ) {
    const taskExists = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!taskExists) {
      throw new BadRequestException(`Task with ID ${taskId} not found.`);
    }

    await this.getProjectMembership(taskExists.projectId, userId);

    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        taskId,
        authorId: userId,
      },
    });

    return comment;
  }

  async findAll(taskId: string, userId: string) {
    const taskExists = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!taskExists) {
      throw new BadRequestException(`Task with ID ${taskId} not found.`);
    }

    await this.getProjectMembership(taskExists.projectId, userId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return comments;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }

    const isAuthor = comment.authorId === userId;
    if (!isAuthor) {
      throw new ForbiddenException('You are not the author of this comment');
    }

    return await this.prisma.comment.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
      },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }

    const projectMembership = await this.getProjectMembership(
      comment.task.projectId,
      userId,
    );

    const isAuthor = comment.authorId === userId;
    const isManagerOrOwner =
      projectMembership.role === ProjectRole.MANAGER ||
      projectMembership.role === ProjectRole.OWNER;

    if (!isAuthor && !isManagerOrOwner) {
      throw new ForbiddenException(
        'You are not authorized to delete this comment',
      );
    }

    return await this.prisma.comment.delete({
      where: { id },
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
}
