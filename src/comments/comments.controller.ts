import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Patch(':commentId')
  update(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.update(commentId, updateCommentDto, user.sub);
  }

  @Delete(':commentId')
  remove(
    @Param('commentId') commentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.remove(commentId, user.sub);
  }
}
