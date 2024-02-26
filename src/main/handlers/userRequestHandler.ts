import { Request, Response } from 'express';
import { UserHandler } from '@main/types/web';
import { UserService } from '@main/services/UserService';
import { NotFoundException } from '@main/exception/NotFoundException';
import {
  GenericResponse,
  MakeDepositRequest,
  UserDto,
  UserRequest
} from '@main/types/dto';
import { commonUtils, logger } from 'tspa';
import { executeRequest } from '@main/handlers/requestHandler';

let userService: UserService;

const createUser = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<UserDto>(
    async () => {
      logger.info('Creating user:', request.body);
      const { username, password, deposit, roleId, machineId }: UserRequest =
        request.body;
      if (
        commonUtils.isAnyEmpty(username, password, deposit, roleId, machineId)
      ) {
        throw new Error('Invalid user, cannot be handled');
      }

      return await userService.createUser(request.body as UserRequest);
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
      if (commonUtils.isEmpty(id)) throw new Error('Invalid user id');

      const user = await userService.findUserById(id!);
      if (!user) throw new NotFoundException('User not found');
      return user;
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
  await executeRequest<GenericResponse<string>>(
    async () => {
      const { id } = request.params;
      const depositRequest: MakeDepositRequest = request.body;
      if (commonUtils.isAnyEmpty(id, depositRequest.amount)) {
        throw new Error('Invalid deposit data');
      }

      const update = await userService.makeDeposit(id!, depositRequest.amount);
      const data = update ? 'Success' : 'Failed';

      return {
        success: update,
        data
      };
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
      const { id, roleId } = request.params;
      if (commonUtils.isAnyEmpty(id, roleId) || !roleId) {
        throw new Error('Invalid user data');
      }

      const update = await userService.updateUser(id!, {
        roleId
      });
      const data = update ? 'Updated' : 'Failed';

      return {
        success: update,
        data
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
      if (commonUtils.isAnyEmpty(id)) {
        throw new Error('Invalid User ID');
      }

      const removal = await userService.removeUser(id!);
      if (!removal) throw new Error('Failed to delete user');
      const data = removal ? 'Deleted' : 'Failed';

      return {
        success: removal,
        data
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
    fetchUserById,
    makeDeposit,
    updateRole,
    deleteUser
  };
};
