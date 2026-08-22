import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private users: User[] = [];

  private async hashString(str: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(str, saltRounds);
  }

  async create(createUserDto: CreateUserDto) {
    const user: User = {
      id: crypto.randomUUID(),
      ...createUserDto,
      password: await this.hashString(createUserDto.password),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  findAll() {
    return this.users ?? [];
  }

  findOne(id: string) {
    const user = this.users.find((user) => user.id === id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findUserByEmail(email: string) {
    const user = this.users.find((user) => user.email === email);
    if (!user) return null;
    return user;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    const user = this.findOne(id);

    if (!user) throw new NotFoundException(`User #${id} not found`);

    Object.assign(user, updateUserDto, { updatedAt: new Date() });
    return user;
  }

  remove(id: string) {
    const user = this.findOne(id);

    if (!user) throw new NotFoundException(`User #${id} not found`);

    this.users = this.users.filter((t) => t.id !== id);
    return user;
  }
}
