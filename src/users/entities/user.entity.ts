import { RoleEnum } from 'src/enums/user-role.enum';

export class User {
  readonly id!: string;
  readonly name!: string;
  readonly email!: string;
  readonly password!: string;
  readonly role!: RoleEnum;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}
