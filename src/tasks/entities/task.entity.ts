export class Task {
  readonly id!: string;
  readonly title!: string;
  readonly description?: string;
  readonly owner_id!: string;
  readonly project_id!: string;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}
