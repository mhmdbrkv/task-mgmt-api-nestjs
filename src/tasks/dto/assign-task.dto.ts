import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTaskDto {
  @IsUUID()
  @IsNotEmpty()
  readonly assigneeId: string;
}
