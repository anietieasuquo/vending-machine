import { GenericHandler } from '@main/types/web';
import { commonUtils, logger, Optional } from 'tspa';
import { RoleService } from '@main/services/RoleService';
import { AccessClient, Privilege, Role, User } from '@main/types/store';
import { generateSha256 } from '@main/util/commons';
import { TokenService } from '@main/services/TokenService';
import { UserService } from '@main/services/UserService';
import { StartupResponse, UserRequest } from '@main/types/dto';
import { DatabaseService } from '@main/services/DatabaseService';
import fs from 'fs';
import path from 'path';
import os from 'os';
import * as process from 'process';
import { AccessClientService } from '@main/services/AccessClientService';

let roleService: RoleService;
let accessClientService: AccessClientService;
let userService: UserService;

const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD =
  process.env.DEFAULT_ADMIN_PASSWORD || 'Admin!user!24!7!365%%';
const DEFAULT_VENDING_MACHINE_CLIENT_NAME =
  process.env.DEFAULT_VENDING_MACHINE_NAME || 'Default';
const buyerRoleName = 'Buyer';
const sellerRoleName = 'Seller';
const adminRoleName = 'Admin';

const storeStartupData = (data: StartupResponse, filename: string): void => {
  const homeDir = os.homedir();
  const directory = path.join(homeDir, filename);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const filePath = path.join(directory, `${filename}.json`);
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, jsonData);

  logger.info(`Startup data stored in ${filePath}`);
};

const createDefaultRoles = async (): Promise<Role[]> => {
  logger.info('Startup handler > Checking default roles');
  const rolesPromises: Promise<Optional<Role>>[] = [
    roleService.findRoleByName(sellerRoleName),
    roleService.findRoleByName(buyerRoleName),
    roleService.findRoleByName(adminRoleName)
  ];
  const [sellerRole, buyerRole, adminRole] = await Promise.all(rolesPromises);
  const seller: Role = {
    name: sellerRoleName,
    privileges: [
      Privilege.VIEW_PRODUCT,
      Privilege.ADD_PRODUCT,
      Privilege.UPDATE_PRODUCT,
      Privilege.DELETE_PRODUCT
    ]
  };

  const buyer: Role = {
    name: buyerRoleName,
    privileges: [Privilege.VIEW_PRODUCT, Privilege.PURCHASE, Privilege.DEPOSIT]
  };

  const admin: Role = {
    name: adminRoleName,
    privileges: [Privilege.ALL],
    isAdmin: true
  };

  const roles: Role[] = [];

  if (sellerRole.isEmpty()) {
    roles.push(seller);
  }
  if (buyerRole.isEmpty()) {
    roles.push(buyer);
  }
  if (adminRole.isEmpty()) {
    roles.push(admin);
  }

  if (roles.length === 0) {
    logger.info('Default roles already exist');
    return [];
  }

  logger.info('Startup handler > Creating default roles');
  const result: Role[] = await roleService.createRoles(roles);
  if (result.length !== 3) {
    logger.error('Failed to create default roles:', { result });
    throw new Error('Failed to create default roles');
  }
  return result;
};

const createDefaultVendingMachineClient = async (): Promise<AccessClient> => {
  logger.info('Startup handler > Checking default vending machine client');

  const name = DEFAULT_VENDING_MACHINE_CLIENT_NAME;
  const existingClient: Optional<AccessClient> =
    await accessClientService.findSecretBy({ name });
  if (existingClient.isPresent()) {
    logger.info(
      'Startup handler > Default vending machine client already exists'
    );
    return existingClient.get();
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

  const createdClient = await accessClientService.createSecret(client);
  logger.info(
    'Startup handler > Default vending machine client created:',
    clientId
  );
  return { ...createdClient, clientSecret };
};

const createAdminUser = async (): Promise<User> => {
  logger.info('Startup handler > Checking admin user');

  const adminUserExists = await userService.findUserByUsername(
    DEFAULT_ADMIN_USERNAME
  );
  if (adminUserExists.isPresent()) {
    logger.info(
      'Startup handler > Admin user already exists:',
      adminUserExists.get()
    );
    return adminUserExists.get();
  }

  const adminRole: Role = (
    await roleService.findRoleByName(adminRoleName)
  ).orElseThrow(new Error('Admin role not found'));

  const adminClient: AccessClient = (
    await accessClientService.findSecretBy({
      name: DEFAULT_VENDING_MACHINE_CLIENT_NAME
    })
  ).orElseThrow(new Error('Admin client not found'));

  const password: string = DEFAULT_ADMIN_PASSWORD;
  const adminUser: UserRequest = {
    username: DEFAULT_ADMIN_USERNAME,
    password,
    deposit: { value: 0, currency: 'USD', unit: 'cent' },
    role: adminRole.name,
    machine: adminClient.name
  };

  const createdUser = await userService.createAdmin(adminUser);
  logger.info('Startup handler > Admin user created:', {
    username: createdUser.username
  });
  return { ...createdUser, password };
};

const run = async (): Promise<StartupResponse> => {
  const connected = await DatabaseService.connect();
  if (!connected) {
    throw new Error('Failed to connect to database');
  }

  logger.info('Startup handler > Initializing');
  const roles = await createDefaultRoles();
  const accessClient = await createDefaultVendingMachineClient();
  const admin = await createAdminUser();
  logger.info('Startup complete');
  const startUpResponse: StartupResponse = { roles, accessClient, admin };
  storeStartupData(startUpResponse, 'vending-machine');
  return startUpResponse;
};

export default (
  injectedRoleService: RoleService,
  injectedAccessClientService: AccessClientService,
  injectedUserService: UserService
): GenericHandler<void, Promise<StartupResponse>> => {
  roleService = injectedRoleService;
  accessClientService = injectedAccessClientService;
  userService = injectedUserService;

  return {
    run
  };
};
