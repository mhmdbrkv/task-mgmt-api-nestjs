import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';

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

  @IsString()
  @IsNotEmpty()
  readonly role!: 'user' | 'admin';
}
