import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];

  create(createUserDto: CreateUserDto) {
    const user: User = {
      id: crypto.randomUUID(),
      ...createUserDto,
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
