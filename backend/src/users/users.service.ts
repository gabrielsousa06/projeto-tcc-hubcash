import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async create(data: { name: string; email: string; password: string }) {
    const user = await this.prisma.user.create({ data });
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, data: { name?: string; email?: string; password?: string }) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async delete(id: string) {
  await this.prisma.transaction.deleteMany({
    where: { userId: id },
  });

  await this.prisma.user.delete({
    where: { id },
  });

  return { message: 'Usuário deletado com sucesso' };
}
}

