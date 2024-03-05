import { Request, Response } from 'express';
import { RoleHandler } from '@main/types/web';
import { RoleDto } from '@main/types/dto';
import { logger } from 'tspa';
import { executeRequest } from '@main/handlers/requestHandler';
import { fromRoleToRoleDto } from '@main/util/mapper';
import { Role } from '@main/types/store';
import { RoleService } from '@main/services/RoleService';

let roleService: RoleService;

const getRoles = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<RoleDto[]>(
    async () => {
      logger.info('Fetching roles:');

      const purchases: Role[] = await roleService.getRoles();
      return purchases.map(fromRoleToRoleDto);
    },
    200,
    response,
    request
  );
};

export default (injectedRoleService: RoleService): RoleHandler => {
  roleService = injectedRoleService;

  return {
    getRoles
  };
};
