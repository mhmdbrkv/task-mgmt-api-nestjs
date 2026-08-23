import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';

import { RoleEnum } from 'src/enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(64)
  readonly name!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  readonly email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  readonly password!: string;

  @IsEnum(RoleEnum)
  @IsNotEmpty()
  readonly role!: RoleEnum;
}
