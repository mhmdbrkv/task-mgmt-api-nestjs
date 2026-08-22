import { Injectable, ConflictException } from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { User } from 'src/auth/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';

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
  ) {}

  validateUser(email: string, password: string): returnType {
    const user = this.userService.findUserByEmail(email);
    if (!user || user.password !== password)
      return { status: false, message: 'Invalid credentials!' };
    else return { status: true, payload: user };
  }

  register(registerAuthDto: RegisterAuthDto) {
    // extract user data
    const { name, email, password, role } = registerAuthDto;
    // check if user already exists
    const userExists = this.userService.findUserByEmail(email);
    if (userExists) {
      throw new ConflictException('User already exists');
    }
    // create user if not exists
    const user = this.userService.create({
      name,
      email,
      password,
      role,
    });

    // return user
    return user;
  }

  async login(loginAuthDto: LoginAuthDto, res: Response) {
    // extract user data
    const { email, password } = loginAuthDto;
    // validate user
    const user = this.validateUser(email, password);
    if (!user.status) return res.status(401).json(user.message);

    // generate token
    const payload = {
      sub: user.payload.id,
      name: user.payload.name,
      role: user.payload.role,
    };

    const access_token = await this.jwtService.signAsync(payload);

    // return user
    return res.status(200).json({
      message: 'Login successful!',
      access_token,
      user: {
        id: user.payload.id,
        name: user.payload.name,
        email: user.payload.email,
        role: user.payload.role,
      },
    });
  }
}
