import { IsOptional, IsNumber, IsEnum, IsDateString, Min, IsNotEmpty } from 'class-validator';

export class UpdateTransactionDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Título não pode ser vazio' })
  title?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  amount?: number;

  @IsOptional()
  @IsEnum(['INCOME', 'EXPENSE'], { message: 'Tipo deve ser INCOME ou EXPENSE' })
  type?: 'INCOME' | 'EXPENSE';

  @IsOptional()
  @IsNotEmpty({ message: 'Categoria não pode ser vazia' })
  category?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data inválida' })
  date?: string;
}