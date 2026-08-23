import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleEnum } from 'src/enums/user-role.enum';
import { UserRole } from '../../generated/prisma/client';
import { SkipAuthGuard } from 'src/guard/skip-auth.guard';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async hashString(str: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(str, saltRounds);
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        role: createUserDto.role.toUpperCase() as UserRole,
        password: await this.hashString(createUserDto.password),
      },
    });
    return {
      ...user,
      role: user.role.toLowerCase() as RoleEnum,
    };
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map((user) => ({
      ...user,
      role: user.role.toLowerCase() as RoleEnum,
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return {
      ...user,
      role: user.role.toLowerCase() as RoleEnum,
    };
  }

  async findUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return {
      ...user,
      role: user.role.toLowerCase() as RoleEnum,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (!user) throw new NotFoundException(`User #${id} not found`);

    const { password, role, ...rest } = updateUserDto;
    const updateData: any = { ...rest };

    if (password) {
      updateData.password = await this.hashString(password);
    } else {
      updateData.password = user.password;
    }

    if (role) {
      updateData.role = role.toUpperCase() as UserRole;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return {
      ...updated,
      role: updated.role.toLowerCase() as RoleEnum,
    };
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    if (!user) throw new NotFoundException(`User #${id} not found`);

    await this.prisma.user.delete({ where: { id } });
    return user;
  }
}
