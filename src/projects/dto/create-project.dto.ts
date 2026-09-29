import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  @Transform(({ value }) => value?.trim())
  description?: string;
}
