export class CreateTaskDto {
  readonly title!: string;
  readonly description?: string;
  readonly owner_id!: number;
  readonly project_id!: number;
}
