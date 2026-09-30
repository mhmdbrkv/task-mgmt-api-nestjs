import {
  IsEnum,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { InvitationRole } from '../../common/enums/invitations.enum';
import { Transform } from 'class-transformer';

export class CreateInvitationDto {
  @IsUUID()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  readonly inviteeId: string;

  @IsEnum(InvitationRole)
  readonly role: InvitationRole;

  @IsDateString()
  @IsOptional()
  readonly expiresAt?: string;
}
