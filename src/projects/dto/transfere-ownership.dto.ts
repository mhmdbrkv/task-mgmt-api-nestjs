import { IsNotEmpty, IsUUID } from 'class-validator';

export class TransferOwnershipDto {
  @IsNotEmpty()
  @IsUUID()
  newOwnerId: string;
}
