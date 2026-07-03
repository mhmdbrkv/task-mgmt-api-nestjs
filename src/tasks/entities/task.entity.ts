export class Task {
  readonly id!: number;
  readonly title!: string;
  readonly description?: string;
  readonly owner_id!: number;
  readonly project_id!: number;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}
