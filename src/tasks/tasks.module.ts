import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { CommentsService } from 'src/comments/comments.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, CommentsService],
})
export class TasksModule {}
