import { IsOptional, IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Nome não pode ser vazio' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password?: string;
}