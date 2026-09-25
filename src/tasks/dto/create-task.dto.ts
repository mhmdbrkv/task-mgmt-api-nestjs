import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
  IsDate,
  IsDateString,
} from 'class-validator';
import { TaskPriority } from 'src/common/enums/task-priority.enum';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(64)
  readonly title: string;

  @IsString()
  @IsOptional()
  @MinLength(12)
  @MaxLength(256)
  readonly description?: string;

  @IsUUID()
  @IsOptional()
  readonly assigneeId?: string;

  @IsOptional()
  readonly priority?: TaskPriority;

  @IsDateString()
  @IsOptional()
  readonly dueDate?: string;
}
