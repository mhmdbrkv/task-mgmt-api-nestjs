import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipGuard = this.reflector.getAllAndOverride<boolean>('skipAuthGuard', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipGuard) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = await this.jwtService.verifyAsync(token);
      request['user'] = decoded;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
    return true;
  }
}
