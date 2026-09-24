import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TransferOwnershipDto } from './dto/transfere-ownership.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.create(createProjectDto, user.sub);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.projectsService.findAll(user.sub);
  }

  @Get(':projectId')
  findOne(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.findOne(projectId, user.sub);
  }

  @Patch(':projectId')
  update(
    @Param('projectId') projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.update(projectId, updateProjectDto, user.sub);
  }

  @Delete(':projectId')
  remove(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.remove(projectId, user.sub);
  }

  @Post(':projectId/transfer-ownership')
  transferOwnership(
    @Param('projectId') projectId: string,
    @Body() transferOwnershipDto: TransferOwnershipDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.transferOwnership(
      projectId,
      user.sub,
      transferOwnershipDto.newOwnerId,
    );
  }

  @Get(':projectId/members')
  getProjectMembers(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.getProjectMembers(projectId, user.sub);
  }

  @Post(':projectId/members/:memberId/promote')
  promoteProjectMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.promoteProjectMember(
      projectId,
      user.sub,
      memberId,
    );
  }

  @Post(':projectId/members/:memberId/demote')
  demoteProjectManager(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.demoteProjectManager(
      projectId,
      user.sub,
      memberId,
    );
  }
}
