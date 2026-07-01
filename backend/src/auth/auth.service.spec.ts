import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('deve estar definido', () => {
    expect(authService).toBeDefined();
  });

  it('deve lançar erro se usuário já existe', async () => {
    mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@test.com' });

    await expect(
      authService.register('Gabriel', 'test@test.com', '123456'),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve registrar um novo usuário com sucesso', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockUsersService.create.mockResolvedValue({ id: '1', name: 'Gabriel', email: 'test@test.com' });

    const result = await authService.register('Gabriel', 'test@test.com', '123456');
    expect(result).toHaveProperty('id');
  });
});