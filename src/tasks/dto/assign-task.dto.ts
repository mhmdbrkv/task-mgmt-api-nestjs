import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTaskDto {
  @IsUUID()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  readonly assigneeId: string;
}
