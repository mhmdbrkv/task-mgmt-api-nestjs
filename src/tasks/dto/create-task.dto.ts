import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(64)
  readonly title: string;

  @IsString()
  @IsOptional()
  @MinLength(12)
  @MaxLength(256)
  readonly description: string;

  @IsString()
  @IsNotEmpty()
  readonly owner_id: string;

  @IsString()
  @IsNotEmpty()
  readonly project_id: string;
}
