import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { AssignTaskDto } from './dto/assign-task.dto';
import { TaskPriorityDto } from './dto/task-priority.dto';
import { TaskStatusDto } from './dto/task-status.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // @Post()
  // create(@Body() createTaskDto: CreateTaskDto) {
  //   return this.tasksService.create(createTaskDto);
  // }

  // @Get()
  // findAll() {
  //   return this.tasksService.findAll();
  // }

  @Get(':taskId')
  findOne(@Param('taskId') taskId: string, @CurrentUser() user: JwtPayload) {
    return this.tasksService.findOne(taskId, user.sub);
  }

  @Patch(':taskId')
  update(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.update(taskId, updateTaskDto, user.sub);
  }

  @Post(':taskId/assign')
  assignTask(
    @Param('taskId') taskId: string,
    @Body() assignTaskDto: AssignTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.assignTask(taskId, assignTaskDto, user.sub);
  }

  @Post(':taskId/unassign')
  unassignTask(
    @Param('taskId') taskId: string,
    @Body() assignTaskDto: AssignTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.unassignTask(taskId, assignTaskDto, user.sub);
  }

  @Patch(':taskId/priority')
  changeTaskPriority(
    @Param('taskId') taskId: string,
    @Body() taskPriorityDto: TaskPriorityDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.changeTaskPriority(
      taskId,
      taskPriorityDto,
      user.sub,
    );
  }

  @Patch(':taskId/status')
  changeTaskStatus(
    @Param('taskId') taskId: string,
    @Body() taskStatusDto: TaskStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.changeTaskStatus(taskId, taskStatusDto, user.sub);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.tasksService.remove(id);
  // }
}
