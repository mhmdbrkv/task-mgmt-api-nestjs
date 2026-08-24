import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

import { User } from 'src/auth/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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

  private async validateUser(
    email: string,
    password: string,
  ): Promise<returnType> {
    const user = await this.userService.findUserByEmail(email);
    if (!user || !(await this.compareWithHashString(password, user.password)))
      return { status: false, message: 'Invalid credentials!' };
    return { status: true, payload: user };
  }

  private async compareWithHashString(
    plainStr: string,
    hashedStr: string,
  ): Promise<boolean> {
    const isMatch = await bcrypt.compare(plainStr, hashedStr);
    return isMatch;
  }

  private async generateToken({ id, name, role }: User) {
    // generate token
    const payload = {
      sub: id,
      name: name,
      role: role,
    };

    return this.jwtService.signAsync(payload);
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

    // generate token
    const accessToken = await this.generateToken(user);

    // return user
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // extract user data
    const { email, password } = loginDto;
    // validate user
    const user = await this.validateUser(email, password);
    if (!user.status) throw new UnauthorizedException(user.message);

    // generate token
    const accessToken = await this.generateToken(user.payload);

    // return user
    return {
      accessToken,
      user: {
        id: user.payload.id,
        name: user.payload.name,
        email: user.payload.email,
        role: user.payload.role,
      },
    };
  }

  async logout() {
    return;
  }
}
