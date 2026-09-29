import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(64)
  @Transform(({ value }) => value?.trim())
  readonly name!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => value?.trim())
  readonly email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Transform(({ value }) => value?.trim())
  readonly password!: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  readonly role!: UserRole;
}
