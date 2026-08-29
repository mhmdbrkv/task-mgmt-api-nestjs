import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { randomUUID, randomBytes, createHash, timingSafeEqual } from 'crypto';

import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import ms from 'ms';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

type returnType =
  | {
      status: true;
      payload: User;
    }
  | {
      status: false;
      message: string;
    };

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private async validateUser(
    email: string,
    password: string,
  ): Promise<returnType> {
    const user = await this.userService.findUserByEmail(email);
    if (!user || !(await this.comparePasswords(password, user.password)))
      return { status: false, message: 'Invalid credentials!' };
    return { status: true, payload: user };
  }

  private async comparePasswords(
    plainStr: string,
    hashedStr: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainStr, hashedStr);
  }

  private compareRefreshToken(secret: string, hashedSecret: string): boolean {
    const secretHash = this.hashRefreshToken(secret);
    const secretBuffer = Buffer.from(secretHash);
    const hashedBuffer = Buffer.from(hashedSecret);

    if (secretBuffer.length !== hashedBuffer.length) {
      return false;
    }
    return timingSafeEqual(secretBuffer, hashedBuffer);
  }

  private async generateAccessToken(payload: JwtPayload) {
    return await this.jwtService.signAsync(payload);
  }

  private generateRefreshToken(sessionId: string): string {
    const secret = randomBytes(64).toString('hex');

    return `${sessionId}.${secret}`;
  }

  private generateSession() {
    const sessionId = randomUUID();
    const refreshToken = this.generateRefreshToken(sessionId);
    return { sessionId, refreshToken };
  }

  private hashRefreshToken(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }

  private parseRefreshToken(refreshToken: string) {
    const separatorIndex = refreshToken.indexOf('.');

    if (separatorIndex === -1) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      sessionId: refreshToken.slice(0, separatorIndex),
      secret: refreshToken.slice(separatorIndex + 1),
    };
  }

  private getRefreshTokenExpiration() {
    return new Date(
      Date.now() +
        ms(this.config.getOrThrow<ms.StringValue>('jwt.refreshTokenExpiresIn')),
    );
  }

  async register(registerDto: RegisterDto) {
    // extract user data
    const { name, email, password, role } = registerDto;
    // check if user already exists
    const userExists = await this.userService.findUserByEmail(email);
    if (userExists) throw new ConflictException('User already exists');

    // create user if not exists
    const user = await this.userService.create({
      name,
      email,
      password,
      role,
    });

    // generate session
    const { sessionId, refreshToken } = this.generateSession();

    const familyId = randomUUID();

    const [, secret] = refreshToken.split('.');
    const refreshTokenHash = await this.hashRefreshToken(secret);

    const expiresAt = this.getRefreshTokenExpiration();

    // create session
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        familyId,
        refreshTokenHash,
        expiresAt,
      },
    });

    // generate token
    const accessToken = await this.generateAccessToken({
      sub: user.id,
      role: user.role,
      sessionId,
    });

    // return access and refresh token
    return {
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    // extract user data
    const { email, password } = loginDto;
    // validate user
    const user = await this.validateUser(email, password);
    if (!user.status) throw new UnauthorizedException(user.message);

    // generate session
    const { sessionId, refreshToken } = this.generateSession();

    const familyId = randomUUID();

    const [, secret] = refreshToken.split('.');
    const refreshTokenHash = await this.hashRefreshToken(secret);

    const expiresAt = this.getRefreshTokenExpiration();

    // create session
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.payload.id,
        familyId,
        refreshTokenHash,
        expiresAt,
      },
    });

    // generate token
    const accessToken = await this.generateAccessToken({
      sub: user.payload.id,
      role: user.payload.role,
      sessionId,
    });

    // return access and refresh token
    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const { sessionId, secret } = this.parseRefreshToken(refreshToken);

    const session = await this.prisma.session.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // add check here
    if (!session.user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    if (session.revokedAt) {
      const GRACE_PERIOD_MS = 15 * 1000; // 15 seconds
      const isWithinGracePeriod =
        Date.now() - session.revokedAt.getTime() < GRACE_PERIOD_MS;

      if (!isWithinGracePeriod) {
        // Malicious reuse detected after grace period -> revoke family
        await this.prisma.session.updateMany({
          where: { familyId: session.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Refresh token reuse detected');
      }

      throw new UnauthorizedException('Refresh token already rotated');
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // validate hashed refresh secret
    const isValid = this.compareRefreshToken(secret, session.refreshTokenHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // generate new refresh token
    const { sessionId: newSessionId, refreshToken: newRefreshToken } =
      this.generateSession();

    const { secret: newSecret } = this.parseRefreshToken(newRefreshToken);

    const newRefreshTokenHash = this.hashRefreshToken(newSecret);

    const expiresAt = this.getRefreshTokenExpiration();

    // using transaction to ensure atomicity for refresh token rotation
    await this.prisma.$transaction(async (tx) => {
      const result = await tx.session.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      if (result.count !== 1) {
        throw new UnauthorizedException('Refresh token already used');
      }

      await tx.session.create({
        data: {
          id: newSessionId,
          familyId: session.familyId,
          userId: session.userId,
          refreshTokenHash: newRefreshTokenHash,
          expiresAt,
        },
      });
    });

    // generate new access token
    const newAccessToken = await this.generateAccessToken({
      sub: session.user.id,
      role: session.user.role,
      sessionId: newSessionId,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    const { sessionId } = this.parseRefreshToken(refreshToken);

    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return;
  }

  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async getSessions(userId: string, currentSessionId: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions.map((session) => ({
      ...session,
      current: session.id === currentSessionId,
    }));
  }

  async revokeSession(sessionId: string, userId: string) {
    const result = await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Session not found');
    }

    return;
  }
}
