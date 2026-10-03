import { TaskPriority } from '../../common/enums/tasks.enum';
import { IsEnum } from 'class-validator';

export class TaskPriorityDto {
  @IsEnum(TaskPriority)
  readonly priority: TaskPriority;
}
