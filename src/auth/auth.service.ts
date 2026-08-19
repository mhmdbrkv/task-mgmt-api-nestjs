import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class AuthService {
  private users: User[] = [];

  register(registerAuthDto: RegisterAuthDto) {
    // extract user data
    const { name, email, password, role } = registerAuthDto;
    // check if user already exists
    const userExists = this.users.find((user) => user.email === email);
    if (userExists) {
      throw new ConflictException('User already exists');
    }
    // create user if not exists
    const user: User = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    // generate token
    // return user
    return user;
  }

  login(loginAuthDto: LoginAuthDto) {
    // extract user data
    const { email, password } = loginAuthDto;
    // find user by email
    const user = this.users.find((user) => user.email === email);
    if (!user) {
      throw new ConflictException('Invalid Credentials');
    }
    // check if password is correct
    if (user.password !== password) {
      throw new ConflictException('Invalid Credentials');
    }
    // generate token
    // return user
    return user;
  }

  findAll() {
    return this.users;
  }
}
