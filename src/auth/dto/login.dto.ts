import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
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
}
