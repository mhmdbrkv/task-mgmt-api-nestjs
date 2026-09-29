import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUUID,
  IsDate,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { TaskPriority } from 'src/common/enums/tasks.enum';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(64)
  @Transform(({ value }) => value?.trim())
  readonly title: string;

  @IsString()
  @IsOptional()
  @MinLength(12)
  @MaxLength(256)
  @Transform(({ value }) => value?.trim())
  readonly description?: string;

  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  readonly assigneeId?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  readonly priority?: TaskPriority;

  @IsDateString()
  @IsOptional()
  readonly dueDate?: string | null;
}
