import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TasksService } from '../tasks/tasks.service';
import { InvitationsService } from '../invitations/invitations.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, TasksService, InvitationsService],
})
export class ProjectsModule {}
