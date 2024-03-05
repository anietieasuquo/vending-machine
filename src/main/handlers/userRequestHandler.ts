import { Request, Response } from 'express';
import { UserHandler } from '@main/types/web';
import { UserService } from '@main/services/UserService';
import { NotFoundException } from '@main/exception/NotFoundException';
import {
  DepositRequest,
  GenericResponse,
  UserDto,
  UserRequest
} from '@main/types/dto';
import { logger, Objects } from 'tspa';
import { executeRequest } from '@main/handlers/requestHandler';
import { BadRequestException } from '@main/exception/BadRequestException';
import { User } from '@main/types/store';
import { fromUserToUserDto } from '@main/util/mapper';
import { InternalServerException } from '@main/exception/InternalServerException';

let userService: UserService;

const createUser = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<UserDto>(
    async () => {
      logger.info('Creating user:', request.body);
      const { username, password, role, machine }: UserRequest = request.body;
      Objects.requireNonEmpty(
        [username, password, role, machine],
        new BadRequestException('Invalid user data, cannot be processed')
      );

      const newUser: User = await userService.createUser(
        request.body as UserRequest
      );
      return fromUserToUserDto(newUser);
    },
    201,
    response,
    request
  );
};

const createAdmin = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<UserDto>(
    async () => {
      logger.info('Creating admin user:', request.body);
      const { username, password, deposit, role, machine }: UserRequest =
        request.body;
      Objects.requireNonEmpty(
        [username, password, deposit, role, machine],
        new BadRequestException('Invalid user, cannot be handled')
      );

      const newUser: User = await userService.createAdmin(
        request.body as UserRequest
      );
      return fromUserToUserDto(newUser);
    },
    201,
    response,
    request
  );
};

const fetchUserById = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<UserDto>(
    async () => {
      const { id } = request.params;
      Objects.requireNonEmpty(id, new BadRequestException('Invalid user id'));

      const user: User = (await userService.findUserById(id)).orElseThrow(
        new NotFoundException('User not found')
      );
      return fromUserToUserDto(user);
    },
    200,
    response,
    request
  );
};

const fetchAllUsers = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<UserDto[]>(
    async () => {
      const users: User[] = await userService.findAll();
      return users.map(fromUserToUserDto);
    },
    200,
    response,
    request
  );
};

const makeDeposit = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<Pick<UserDto, 'deposit'>>(
    async () => {
      const { id } = request.params;
      const depositRequest: DepositRequest = request.body;
      Objects.requireNonEmpty(
        [id, depositRequest.amount],
        new BadRequestException('Invalid deposit data')
      );

      const { deposit } = await userService.makeDeposit(
        id,
        depositRequest.amount
      );
      return { deposit };
    },
    200,
    response,
    request
  );
};

const resetDeposit = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<Pick<UserDto, 'deposit'>>(
    async () => {
      const { id } = request.params;
      Objects.requireNonEmpty(id, new BadRequestException('Invalid user id'));

      const { deposit } = await userService.resetDeposit(id);
      return { deposit };
    },
    200,
    response,
    request
  );
};

const updateRole = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<GenericResponse<string>>(
    async () => {
      const { id } = request.params;
      const { role }: UserRequest = request.body;
      Objects.requireNonEmpty(
        [id, role],
        new BadRequestException('Invalid user data')
      );

      const update = await userService.updateRole(id, role);

      Objects.requireTrue(
        update,
        new InternalServerException('Failed to update user role')
      );

      return {
        success: update,
        data: `Role updated successfully`
      };
    },
    200,
    response,
    request
  );
};

const changePassword = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<GenericResponse<string>>(
    async () => {
      const { id } = request.params;
      const { password }: UserRequest = request.body;
      Objects.requireNonEmpty(
        [id, password],
        new BadRequestException('Invalid user data')
      );
      const update = await userService.changePassword(id, password);

      Objects.requireTrue(
        update,
        new InternalServerException('Failed to change password')
      );

      return {
        success: update,
        data: 'Password changed successfully'
      };
    },
    200,
    response,
    request
  );
};

const deleteUser = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<GenericResponse<string>>(
    async () => {
      const { id } = request.params;
      Objects.requireNonEmpty([id], new BadRequestException('Invalid user id'));

      const removal = await userService.removeUser(id);
      Objects.requireTrue(
        removal,
        new InternalServerException('Failed to delete user')
      );

      return {
        success: removal,
        data: 'User deleted successfully'
      };
    },
    200,
    response,
    request
  );
};

export default (injectedUserService: UserService): UserHandler => {
  userService = injectedUserService;

  return {
    createUser,
    createAdmin,
    fetchUserById,
    fetchAllUsers,
    makeDeposit,
    resetDeposit,
    updateRole,
    changePassword,
    deleteUser
  };
};
