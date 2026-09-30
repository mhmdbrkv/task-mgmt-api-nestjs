import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TasksService } from 'src/tasks/tasks.service';
import { InvitationsService } from 'src/invitations/invitations.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, TasksService, InvitationsService],
})
export class ProjectsModule {}
