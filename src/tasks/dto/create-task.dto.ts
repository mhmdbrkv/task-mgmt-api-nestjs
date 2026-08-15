import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
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

  @IsNumber()
  @IsNotEmpty()
  readonly owner_id: number;

  @IsNumber()
  @IsNotEmpty()
  readonly project_id: number;
}
