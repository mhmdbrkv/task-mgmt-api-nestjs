import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TasksService } from 'src/tasks/tasks.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, TasksService],
})
export class ProjectsModule {}
