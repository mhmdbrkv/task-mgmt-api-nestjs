import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

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

  async findOne(id: number) {
    return `This action returns a #${id} comment`;
  }

  async update(id: number, updateCommentDto: UpdateCommentDto) {
    return `This action updates a #${id} comment`;
  }

  async remove(id: number) {
    return `This action removes a #${id} comment`;
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
