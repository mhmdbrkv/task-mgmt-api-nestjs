import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SkipAuth } from '../common/decorators/skip-auth.decorator';
import type { Response, Request } from 'express';
import ms from 'ms';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @SkipAuth()
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, accessToken } =
      await this.authService.register(registerDto);

    // Set refresh token in cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('app.nodeEnv') === 'production',
      sameSite: 'strict',
      maxAge: ms(
        this.config.getOrThrow<ms.StringValue>('jwt.refreshTokenExpiresIn'),
      ),
    });

    return { accessToken };
  }

  @Post('login')
  @SkipAuth()
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, accessToken } =
      await this.authService.login(loginDto);

    // Set refresh token in cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('app.nodeEnv') === 'production',
      sameSite: 'strict',
      maxAge: ms(
        this.config.getOrThrow<ms.StringValue>('jwt.refreshTokenExpiresIn'),
      ),
    });

    return { accessToken };
  }

  @Post('refresh')
  @SkipAuth()
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @CurrentUser('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken: newRefreshToken, accessToken } =
      await this.authService.refresh(refreshToken);

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('app.nodeEnv') === 'production',
      sameSite: 'strict',
      maxAge: ms(
        this.config.getOrThrow<ms.StringValue>('jwt.refreshTokenExpiresIn'),
      ),
    });

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipAuth()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req?.cookies['refresh_token'];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('app.nodeEnv') === 'production',
      sameSite: 'strict',
    });

    return;
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.sub);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('app.nodeEnv') === 'production',
      sameSite: 'strict',
    });
  }

  @Get('sessions')
  async getSessions(@CurrentUser() user: JwtPayload) {
    return this.authService.getSessions(user.sub, user.sessionId);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.authService.revokeSession(sessionId, user.sub);

    return;
  }
}
