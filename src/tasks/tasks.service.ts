import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  private tasks: Task[] = [];

  create(createTaskDto: CreateTaskDto) {
    const task: Task = {
      id: this.tasks.length + 1,
      ...createTaskDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.push(task);
    return task;
  }

  findAll() {
    return this.tasks ?? [];
  }

  findOne(id: number) {
    const task = this.tasks.find((task) => task.id === id);
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = this.findOne(id);

    if (!task) throw new NotFoundException(`Task #${id} not found`);

    Object.assign(task, updateTaskDto, { updatedAt: new Date() });
    return task;
  }

  remove(id: number) {
    const task = this.findOne(id);

    if (!task) throw new NotFoundException(`Task #${id} not found`);

    this.tasks = this.tasks.filter((t) => t.id !== id);
    return task;
  }
}
