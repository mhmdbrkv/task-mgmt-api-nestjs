import { Transform } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class TransferOwnershipDto {
  @IsNotEmpty()
  @IsUUID()
  @Transform(({ value }) => value?.trim())
  newOwnerId: string;
}
