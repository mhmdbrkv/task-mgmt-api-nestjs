import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';

import { UserRole } from '../../common/enums/user-role.enum';

export class RegisterDto {
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

  @IsEnum(UserRole)
  @IsNotEmpty()
  readonly role!: UserRole;
}
