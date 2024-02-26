import { GenericHandler } from '@main/types/web';
import { commonUtils, logger } from 'tspa';
import { RoleService } from '@main/services/RoleService';
import { AccessClient, Privilege, Role } from '@main/types/store';
import { generateSha256 } from '@main/util/commons';
import { TokenService } from '@main/services/TokenService';

let roleService: RoleService;
let tokenService: TokenService;

const createDefaultRoles = async (): Promise<void> => {
  const sellerRole = await roleService.findRoleByName('Seller');
  const buyerRole = await roleService.findRoleByName('Buyer');
  const seller: Role = {
    name: 'Seller',
    privileges: [
      Privilege.VIEW_PRODUCT,
      Privilege.ADD_PRODUCT,
      Privilege.UPDATE_PRODUCT,
      Privilege.DELETE_PRODUCT
    ]
  };

  const buyer: Role = {
    name: 'Buyer',
    privileges: [Privilege.VIEW_PRODUCT, Privilege.PURCHASE, Privilege.DEPOSIT]
  };

  if (!sellerRole && !buyerRole) {
    const roles: Promise<Role>[] = [
      roleService.createRole(seller),
      roleService.createRole(buyer)
    ];
    const result = await Promise.all(roles);
    if (result.length !== 2) {
      logger.error('Failed to create default roles:', { result });
      throw new Error('Failed to create default roles');
    }
    return;
  }

  if (!sellerRole) {
    await roleService.createRole(seller);
  }

  if (!buyerRole) {
    await roleService.createRole(buyer);
  }
};

const createDefaultVendingMachineClient = async (): Promise<void> => {
  const name = 'Default';
  const existingClient = await tokenService.findSecretBy({ name });
  if (existingClient) {
    logger.info(
      'Default vending machine client already exists:',
      existingClient
    );
    return;
  }

  const clientId = commonUtils.generate();
  const clientSecret = generateSha256();
  const client: AccessClient = {
    name,
    clientId,
    clientSecret,
    redirectUris: [],
    grants: TokenService.SUPPORTED_GRANTS
  };

  const createdClient = await tokenService.createSecret(client);
  logger.info('Default vending machine client created:', {
    machineId: createdClient.id,
    clientId
  });
};

const handle = async (): Promise<void> => {
  await createDefaultRoles();
  await createDefaultVendingMachineClient();
};

export default (
  injectedRoleService: RoleService,
  injectedTokenService: TokenService
): GenericHandler<void, Promise<void>> => {
  roleService = injectedRoleService;
  tokenService = injectedTokenService;

  return {
    handle
  };
};
