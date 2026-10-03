import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.invitationsService.getReceivedInvitations(user.sub);
  }

  @Get(':invitationId')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('invitationId') invitationId: string,
  ) {
    return this.invitationsService.findOne(invitationId, user.sub);
  }

  @Delete(':invitationId')
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('invitationId') invitationId: string,
  ) {
    return this.invitationsService.cancel(invitationId, user.sub);
  }

  @Post(':invitationId/accept')
  accept(
    @CurrentUser() user: JwtPayload,
    @Param('invitationId') invitationId: string,
  ) {
    return this.invitationsService.accept(invitationId, user.sub);
  }

  @Post(':invitationId/reject')
  reject(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.invitationsService.reject(invitationId, user.sub);
  }
}
