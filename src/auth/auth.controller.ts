import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import type { Response } from 'express';
import { SkipAuthGuard } from 'src/guard/skip-auth.guard';

@Controller('auth')
@SkipAuthGuard()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerAuthDto: RegisterAuthDto) {
    return this.authService.register(registerAuthDto);
  }

  @Post('login')
  login(@Body() loginAuthDto: LoginAuthDto, @Res() res: Response) {
    return this.authService.login(loginAuthDto, res);
  }
}
