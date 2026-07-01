import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({
      id: '1',
      name: 'Gabriel',
      email: 'gabriel@test.com',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve registrar um usuário e retornar os dados', async () => {
    const result = await controller.register({
      name: 'Gabriel',
      email: 'gabriel@test.com',
      password: '123456',
    });

    expect(result).toHaveProperty('id');
    expect(mockAuthService.register).toHaveBeenCalledWith(
      'Gabriel',
      'gabriel@test.com',
      '123456',
    );
  });
});