import { TaskStatus } from '../../common/enums/tasks.enum';
import { IsEnum } from 'class-validator';

export class TaskStatusDto {
  @IsEnum(TaskStatus)
  readonly status: TaskStatus;
}
