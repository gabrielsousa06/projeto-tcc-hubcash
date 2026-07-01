import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService }, // ✅ mock do Prisma
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve encontrar usuário por email', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: '1',
      email: 'gabriel@test.com',
    });

    const result = await service.findByEmail('gabriel@test.com');
    expect(result).toHaveProperty('email');
  });

  it('deve criar um usuário sem retornar a senha', async () => {
    mockPrismaService.user.create.mockResolvedValue({
      id: '1',
      name: 'Gabriel',
      email: 'gabriel@test.com',
      password: 'hashsenha',
      createdAt: new Date(),
    });

    const result = await service.create({
      name: 'Gabriel',
      email: 'gabriel@test.com',
      password: 'hashsenha',
    });

    expect(result).not.toHaveProperty('password'); // ✅ verifica que senha não é retornada
    expect(result).toHaveProperty('id');
  });
});