import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        category: dto.category,
        date: new Date(dto.date),
        userId,
      },
    });
  }


  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!transaction) {
    throw new Error('Transação não encontrada');
  }

  return this.prisma.transaction.update({
    where: { id },
    data: {
      ...dto,
      date: dto.date ? new Date(dto.date) : undefined,
    },
  });
  } 

  async findByMonth(userId: string, month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  return this.prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: 'desc' },
  });
}

  async getSummary(userId: string, month: number, year: number) {
    const transactions = await this.findByMonth(userId, month, year);

    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }

  async remove(userId: string, id: string) {
  const transaction = await this.prisma.transaction.findFirst({
    where: { id, userId },
  });

  if (!transaction) {
    throw new Error('Transação não encontrada');
  }

  return this.prisma.transaction.delete({
    where: { id },
  });
} 

}