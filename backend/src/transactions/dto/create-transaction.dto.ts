import { IsNotEmpty, IsNumber, IsEnum, IsDateString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'Título é obrigatório' })
  title: string;

  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  amount: number;

  @IsEnum(['INCOME', 'EXPENSE'], { message: 'Tipo deve ser INCOME ou EXPENSE' })
  type: 'INCOME' | 'EXPENSE';

  @IsNotEmpty({ message: 'Categoria é obrigatória' })
  category: string;

  @IsDateString({}, { message: 'Data inválida' })
  date: string;
}