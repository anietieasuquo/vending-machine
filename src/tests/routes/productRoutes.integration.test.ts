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
import {
  AccessClient,
  Product,
  Purchase,
  PurchaseStatus,
  User
} from '../../main/types/store';
import { app } from '../../main/server';
import { ModuleFactory } from '../../main/factories/ModuleFactory';
import { PurchaseRequest, StartupResponse } from '../../main/types/dto';
// @ts-ignore
import { fetchOAuthToken } from '../oauthUtils';
import { sha256 } from '../../main/util/commons';

describe('Products Integration Test', () => {
  let environment: StartedDockerComposeEnvironment;
  let container: StartedGenericContainer;
  let userRepository: TransactionalCrudRepository<User>;
  let productRepository: TransactionalCrudRepository<Product>;
  let purchaseRepository: TransactionalCrudRepository<Purchase>;
  let startupResponse: StartupResponse;
  let buyerRoleId: string;
  let sellerRoleId: string;
  let adminRoleId: string;
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
  const purchase: Purchase = {
    id: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f',
    productId: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f',
    buyerId: '9e7f67cd-b629-4c6e-90fd-8491e9d297c9',
    sellerId: '9e7f67cd-b629-4c6e-90fd-8491e9d297c9',
    amount: {
      currency: 'EUR',
      unit: 'cent',
      value: 100
    },
    status: PurchaseStatus.COMPLETED,
    dateCreated: 1623831600000,
    version: 1
  };
  const product: Product = {
    id: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f',
    sellerId: '9e7f67cd-b629-4c6e-90fd-8491e9d297c9',
    productName: 'iPhone 12',
    productDescription: 'iPhone 12',
    amountAvailable: 10,
    cost: {
      currency: 'EUR',
      unit: 'cent',
      value: 100
    },
    dateCreated: 1623831600000,
    version: 1
  };
  const userModel = createOrGetEntityModel<User>(user, 'users');
  const purchaseModel = createOrGetEntityModel<User>(purchase, 'purchases');
  const productModel = createOrGetEntityModel<Product>(product, 'products');
  const setupPurchase = async (): Promise<{
    productId: string;
    accessToken: string;
  }> => {
    const buyerAccount: User = {
      id: '10001',
      username: 'buyer-1',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 100
      },
      roleId: buyerRoleId,
      machineId: accessClient.id!
    };

    const sellerAccount: User = {
      id: '10002',
      username: 'seller-1',
      password: 'password',
      deposit: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      roleId: sellerRoleId,
      machineId: accessClient.id!
    };

    const productStored: Product = {
      sellerId: '10002',
      productName: 'iPhone 13',
      productDescription: 'iPhone 12',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 10
      },
      dateCreated: 1623831600000,
      dateUpdated: 1623831600000,
      dateDeleted: 1623831600000,
      version: 1,
      deleted: false
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
    const newProduct = await productRepository.create(productStored);

    const accessToken = await fetchOAuthToken({
      clientId: accessClient.clientId,
      clientSecret: accessClient.clientSecret,
      username: buyerAccount.username,
      password: buyerAccount.password,
      scope: 'buyer'
    });

    return { accessToken, productId: newProduct.id! };
  };

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
    buyerRoleId =
      startupResponse.roles.find((role) => role.name === 'Buyer')?.id || '';
    logger.info('Buyer role id:', buyerRoleId);
    sellerRoleId =
      startupResponse.roles.find((role) => role.name === 'Seller')?.id || '';
    logger.info('Seller role id:', sellerRoleId);
    adminRoleId =
      startupResponse.roles.find((role) => role.name === 'Admin')?.id || '';
    logger.info('Admin role id:', adminRoleId);
    accessClient = startupResponse.accessClient;
    userRepository = ModuleFactory.getUserRepository;
    productRepository = ModuleFactory.getProductRepository;
    purchaseRepository = ModuleFactory.getPurchaseRepository;
  });

  afterAll(async () => {
    try {
      await mongoose.disconnect();
      await container.stop();
      await environment.stop();
      await environment.down();
    } catch (error) {
      logger.error('Error during teardown:', error);
    }
  });

  afterEach(async () => {
    await userRepository.findById('0');
    await userModel.deleteMany({});
    await purchaseModel.deleteMany({});
    await productModel.deleteMany({});
  });

  it('should create a new purchase', async () => {
    const { productId, accessToken } = await setupPurchase();
    const purchaseRequest: PurchaseRequest = {
      userId: '10001',
      quantity: 1
    };

    const response = await request(app)
      .post(`/api/v1/products/${productId}/buy`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(purchaseRequest);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('change');
    expect(response.body.change.value).toHaveLength(3);
    expect(response.body.change.value.sort()).toEqual([20, 20, 50].sort());

    const purchaseOptional: Optional<Purchase> =
      await purchaseRepository.findById(response.body.id);
    expect(purchaseOptional.isPresent()).toBe(true);
    const savedPurchase = purchaseOptional.get();
    expect(savedPurchase.amount.value).toBe(10);
    expect(savedPurchase.status).toBe(PurchaseStatus.COMPLETED);
    expect(savedPurchase.buyerId).toBe('10001');
    expect(savedPurchase.productId).toBe(productId);

    const productOptional: Optional<Product> =
      await productRepository.findById(productId);
    expect(productOptional.isPresent()).toBe(true);
    const savedProduct = productOptional.get();
    expect(savedProduct.amountAvailable).toBe(9);

    const buyerOptional: Optional<User> =
      await userRepository.findById('10001');
    expect(buyerOptional.isPresent()).toBe(true);
    const updatedUser = buyerOptional.get();
    expect(updatedUser.deposit.value).toBe(0);
  });

  it('should not create a new purchase if quantity is invalid', async () => {
    const { productId, accessToken } = await setupPurchase();

    const purchaseRequest: PurchaseRequest = {
      userId: '10001',
      quantity: 0
    };
    const response = await request(app)
      .post(`/api/v1/products/${productId}/buy`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(purchaseRequest);

    expect(response.status).toBe(400);
  });
});
