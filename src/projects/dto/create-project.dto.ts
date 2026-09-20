import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  description?: string;
}
