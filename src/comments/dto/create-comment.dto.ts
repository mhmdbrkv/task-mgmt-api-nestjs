import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  content: string;
}
