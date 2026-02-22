import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { mock } from 'node:test';
import { JwtService } from '@nestjs/jwt';

describe('UsersController', () => {
  let controller: UsersController;
  let serivce: UsersService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),

    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({

      controllers: [UsersController],
      providers: [{
        provide: UsersService, useValue: mockUserService
      }, JwtService],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    serivce = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    describe('when user is found', () => {
      const userId = '1';
      const mockResult = { id: userId, name: 'John Doe', email: 'hVY4W@example.com' };

      beforeEach(() => {
        serivce.findOne = jest.fn().mockResolvedValue(mockResult);
      });

      it('should call UsersService.findOne with correct id', async () => {
        await controller.findOne(userId);
        expect(serivce.findOne).toHaveBeenCalledWith(userId);
      });

      it('should return a user with correct params', async () => {
        const result = await controller.findOne(userId);
        expect(result).toEqual(mockResult);
      });
    });

    describe('when user is not found', () => {
      const userId = '999';

      beforeEach(() => {
        serivce.findOne = jest.fn().mockResolvedValue(null);
      });

      it('should throw a NotFoundException', async () => {
        await expect(controller.findOne(userId)).rejects.toThrow("User not found");
      });
    });
  });
});
