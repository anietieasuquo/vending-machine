import {
  DockerComposeEnvironment,
  PullPolicy,
  StartedDockerComposeEnvironment,
  Wait
} from 'testcontainers';
import { StartedGenericContainer } from 'testcontainers/build/generic-container/started-generic-container';
import mongoose from 'mongoose';
import request from 'supertest';
import {
  createOrGetEntityModel,
  logger,
  Optional,
  TransactionalCrudRepository
} from 'tspa';
import { AccessClient, Role, User } from '../../main/types/store';
import { app } from '../../main/server';
import { ModuleFactory } from '../../main/factories/ModuleFactory';
import {
  DepositRequest,
  StartupResponse,
  UserRequest
} from '../../main/types/dto';
// @ts-ignore
import { fetchOAuthToken } from '../oauthUtils';
import { sha256 } from '../../main/util/commons';

describe('Users Integration Test', () => {
  let environment: StartedDockerComposeEnvironment;
  let container: StartedGenericContainer;
  let userRepository: TransactionalCrudRepository<User>;
  let startupResponse: StartupResponse;
  let buyerRole: Role;
  let sellerRole: Role;
  let adminRole: Role;
  let accessClient: AccessClient;
  const mongoService = 'mongodb';
  const setupService = 'mongo-setup';
  const user: User = {
    username: 'buyer-0',
    password: 'password',
    deposit: {
      currency: 'EUR',
      unit: 'cent',
      value: 10
    },
    roleId: '1',
    machineId: '2'
  };
  const userModel = createOrGetEntityModel<User>(user, 'users');

  beforeAll(async () => {
    environment = await new DockerComposeEnvironment('./', 'docker-compose.yml')
      .withBuild()
      .withPullPolicy(PullPolicy.alwaysPull())
      .withWaitStrategy(mongoService, Wait.forListeningPorts())
      .withWaitStrategy(setupService, Wait.forListeningPorts())
      .withEnvironment({ DEBUG: 'testcontainers:containers' })
      .up([mongoService, setupService]);

    container = environment.getContainer(mongoService);
    const host = container.getHost();
    const port = container.getFirstMappedPort();
    logger.info(`Mongodb container is running on: ${host}:${port}`);
    const appName = 'vending-machine';

    process.env['TSPA_MONGO_URI'] =
      `mongodb://${host}:${port}/${appName}?authSource=admin&replicaSet=vending-machine-rs`;

    startupResponse = await ModuleFactory.getStartupHandler.run();
    buyerRole = startupResponse.roles.find((role) => role.name === 'Buyer')!;
    sellerRole = startupResponse.roles.find((role) => role.name === 'Seller')!;
    adminRole = startupResponse.roles.find((role) => role.name === 'Admin')!;
    accessClient = startupResponse.accessClient;
    userRepository = ModuleFactory.getUserRepository;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await container.stop();
    await environment.stop();
    await environment.down();
  });

  afterEach(async () => {
    await userRepository.findById('0');
    await userModel.deleteMany({});
  });

  it('should create a new buyer', async () => {
    const newUserRequest: UserRequest = {
      username: 'buyer-0',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      role: buyerRole.name,
      machine: accessClient.name
    };

    const response = await request(app)
      .post('/api/v1/users')
      .send(newUserRequest);

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(newUserRequest.username);

    const optional: Optional<User> = await userRepository.findOneBy({
      username: newUserRequest.username
    });
    expect(optional.isPresent()).toBe(true);
    const savedUser = optional.get();
    expect(savedUser.username).toBe(newUserRequest.username);
  });

  it('should create a new seller', async () => {
    const newUserRequest: UserRequest = {
      username: 'seller-0',
      password: 'password',
      role: sellerRole.name,
      machine: accessClient.name
    };

    const response = await request(app)
      .post('/api/v1/users')
      .send(newUserRequest);

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(newUserRequest.username);

    const optional: Optional<User> = await userRepository.findOneBy({
      username: newUserRequest.username
    });
    expect(optional.isPresent()).toBe(true);
    const savedUser = optional.get();
    expect(savedUser.username).toBe(newUserRequest.username);
  });

  it('should create a new admin', async () => {
    const newUserRequest: UserRequest = {
      username: 'admin-1',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      role: adminRole.name,
      machine: accessClient.name
    };
    const userAccount: User = {
      username: 'admin-0',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: adminRole.id!,
      machineId: accessClient.id!
    };

    const password = sha256(newUserRequest.password);
    const newUser: User = await userRepository.create({
      ...userAccount,
      password
    });
    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: newUser.username,
      password: newUserRequest.password,
      scope: 'admin'
    });
    const response = await request(app)
      .post('/api/v1/users/admin')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(newUserRequest);

    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(newUserRequest.username);

    const optional: Optional<User> = await userRepository.findOneBy({
      username: newUserRequest.username
    });
    expect(optional.isPresent()).toBe(true);
    const savedUser = optional.get();
    expect(savedUser.username).toBe(newUserRequest.username);
    expect(savedUser.roleId).toBe(adminRole.id!);
  });

  it('should get all users', async () => {
    const buyerAccount: User = {
      username: 'buyer-0',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: buyerRole.id!,
      machineId: accessClient.id!
    };

    const adminAccount: User = {
      username: 'admin-0',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: adminRole.id!,
      machineId: accessClient.id!
    };
    const password = sha256(buyerAccount.password);
    await userRepository.createAll([
      {
        ...buyerAccount,
        password
      },
      {
        ...adminAccount,
        password
      }
    ]);
    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: 'admin-0',
      password: adminAccount.password,
      scope: 'admin'
    });
    const response = await request(app)
      .get('/api/v1/users/')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(
      response.body.some((u: User) => u.username === buyerAccount.username)
    ).toBe(true);
  });

  it('should get a user by id', async () => {
    const userAccount: User = {
      username: 'buyer-0',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: buyerRole.id!,
      machineId: accessClient.id!
    };
    const password = sha256(userAccount.password);
    const newUser: User = await userRepository.create({
      ...userAccount,
      password
    });
    logger.info('New user created:', { userAccount, newUser });
    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: newUser.username,
      password: userAccount.password,
      scope: 'buyer'
    });
    const response = await request(app)
      .get('/api/v1/users/' + newUser.id)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(userAccount.username);
    expect(response.body.roleId).toBe(buyerRole.id!);
  });

  it('should forbid request to fetch user by id if the requester is not the owner', async () => {
    const buyerAccount: User = {
      id: '10001',
      username: 'buyer-0',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: buyerRole.id!,
      machineId: accessClient.id!
    };
    const sellerAccount: User = {
      id: '10002',
      username: 'seller-0',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: sellerRole.id!,
      machineId: accessClient.id!
    };
    const password = sha256(buyerAccount.password);
    await userRepository.createAll([
      {
        ...buyerAccount,
        password
      },
      {
        ...sellerAccount,
        password
      }
    ]);
    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: buyerAccount.username,
      password: buyerAccount.password,
      scope: 'buyer'
    });
    const response = await request(app)
      .get('/api/v1/users/' + sellerAccount.id)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
  });

  it('should make a deposit for a buyer', async () => {
    const depositRequest: DepositRequest = {
      amount: {
        currency: 'EUR',
        unit: 'cent',
        value: 100
      }
    };
    const buyerAccount: User = {
      username: 'buyer-1',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: buyerRole.id!,
      machineId: accessClient.id!
    };

    const password = sha256(buyerAccount.password);
    const newUser: User = await userRepository.create({
      ...buyerAccount,
      password
    });
    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: newUser.username,
      password: buyerAccount.password,
      scope: 'buyer'
    });
    const response = await request(app)
      .post(`/api/v1/users/${newUser.id}/deposits`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(depositRequest);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('deposit');
    expect(response.body.deposit.value).toBe(110);

    const optional: Optional<User> = await userRepository.findById(newUser.id!);
    expect(optional.isPresent()).toBe(true);
    const savedUser = optional.get();
    expect(savedUser.deposit.value).toBe(110);
    expect(savedUser.username).toBe(newUser.username);
  });

  it('should only deposit valid coin denomination', async () => {
    const depositRequest: DepositRequest = {
      amount: {
        currency: 'EUR',
        unit: 'cent',
        value: 7
      }
    };
    const buyerAccount: User = {
      username: 'buyer-1',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: buyerRole.id!,
      machineId: accessClient.id!
    };

    const password = sha256(buyerAccount.password);
    const newUser: User = await userRepository.create({
      ...buyerAccount,
      password
    });
    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: newUser.username,
      password: buyerAccount.password,
      scope: 'buyer'
    });
    const response = await request(app)
      .post(`/api/v1/users/${newUser.id}/deposits`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(depositRequest);

    expect(response.status).toBe(400);
  });

  it('should reset deposit for a buyer', async () => {
    const buyerAccount: User = {
      username: 'buyer-1',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: buyerRole.id!,
      machineId: accessClient.id!
    };

    const password = sha256(buyerAccount.password);
    const newUser: User = await userRepository.create({
      ...buyerAccount,
      password
    });
    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: newUser.username,
      password: buyerAccount.password,
      scope: 'buyer'
    });
    const response = await request(app)
      .post(`/api/v1/users/${newUser.id}/deposits/reset`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('deposit');
    expect(response.body.deposit.value).toBe(0);

    const optional: Optional<User> = await userRepository.findById(newUser.id!);
    expect(optional.isPresent()).toBe(true);
    const savedUser = optional.get();
    expect(savedUser.deposit.value).toBe(0);
    expect(savedUser.username).toBe(newUser.username);
  });

  it('should change password for a user', async () => {
    // @ts-ignore
    const passwordRequest: UserRequest = {
      password: 'new-password'
    };
    const buyerAccount: User = {
      username: 'buyer-1',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: buyerRole.id!,
      machineId: accessClient.id!
    };

    const password = sha256(buyerAccount.password);
    const newUser: User = await userRepository.create({
      ...buyerAccount,
      password
    });
    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: newUser.username,
      password: buyerAccount.password,
      scope: 'buyer'
    });
    const response = await request(app)
      .patch(`/api/v1/users/${newUser.id}/password`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(passwordRequest);

    expect(response.status).toBe(200);

    const newAccessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: newUser.username,
      password: passwordRequest.password,
      scope: 'buyer'
    });
    expect(newAccessToken).toBeTruthy();
  });

  it('should update role for user', async () => {
    const buyerAccount: User = {
      id: '10001',
      username: 'buyer-1',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: buyerRole.id!,
      machineId: accessClient.id!
    };

    const roleUpdate = { role: sellerRole.name };

    const adminAccount: User = {
      username: 'admin-0',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: adminRole.id!,
      machineId: accessClient.id!
    };
    const password = sha256(buyerAccount.password);
    await userRepository.createAll([
      {
        ...buyerAccount,
        password
      },
      {
        ...adminAccount,
        password
      }
    ]);
    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: adminAccount.username,
      password: adminAccount.password,
      scope: 'admin'
    });
    const response = await request(app)
      .patch(`/api/v1/users/${buyerAccount.id}/roles`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(roleUpdate);

    expect(response.status).toBe(200);

    const optional: Optional<User> = await userRepository.findById(
      buyerAccount.id!
    );
    expect(optional.isPresent()).toBe(true);
    const savedUser = optional.get();
    expect(savedUser.roleId).toBe(sellerRole.id!);
  });

  it('should delete a user', async () => {
    const buyerAccount: User = {
      id: '10001',
      username: 'buyer-1',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: buyerRole.id!,
      machineId: accessClient.id!
    };
    const password = sha256(buyerAccount.password);
    await userRepository.create({
      ...buyerAccount,
      password
    });
    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: buyerAccount.username,
      password: buyerAccount.password,
      scope: 'buyer'
    });
    const response = await request(app)
      .delete(`/api/v1/users/${buyerAccount.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    const optional: Optional<User> = await userRepository.findById(
      buyerAccount.id!
    );
    expect(optional.isPresent()).toBe(false);
  });
});
