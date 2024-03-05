import { logger, MongoCrudRepository, TransactionalCrudRepository } from 'tspa';
import {
  AccessClient,
  AccessToken,
  Privilege,
  Product,
  Purchase,
  PurchaseStatus,
  Role,
  User
} from '@main/types/store';
import { UserService } from '@main/services/UserService';
import { TokenService } from '@main/services/TokenService';
import {
  AuthorizationHandler,
  GenericHandler,
  Oauth2AuthHandler,
  ProductHandler,
  PurchaseHandler,
  RoleHandler,
  UserHandler
} from '@main/types/web';
import oauth2Handler from '@main/handlers/oauth2Handler';
import userAccountHandler from '@main/handlers/userRequestHandler';
import productAccountHandler from '@main/handlers/productRequestHandler';
import purchaseAccountHandler from '@main/handlers/purchaseRequestHandler';
import startupHandler from '@main/handlers/startupHandler';
import { RoleService } from '@main/services/RoleService';
import { ProductService } from '@main/services/ProductService';
import { PurchaseService } from '@main/services/PurchaseService';
import authorizationHandler from '@main/handlers/authorizationHandler';
import { StartupResponse } from '@main/types/dto';
import { AccessClientService } from '@main/services/AccessClientService';
import roleRequestHandler from '@main/handlers/roleRequestHandler';

class ModuleFactory {
  private static instance: ModuleFactory;
  private readonly mongoUri: string | undefined = process.env.TSPA_MONGO_URI;
  private readonly appName: string | undefined = process.env.TSPA_APP_NAME;

  private readonly userPrototype: User = {
    id: 'proto',
    dateCreated: Date.now(),
    deleted: false,
    deposit: { value: 0, unit: 'cents', currency: 'EUR' },
    password: '',
    roleId: '',
    username: '',
    isAdmin: false
  };

  private readonly accessTokenPrototype: AccessToken = {
    id: 'proto',
    userId: 'proto',
    type: 'access',
    dateCreated: Date.now(),
    deleted: false,
    accessToken: '',
    clientId: '',
    refreshToken: '',
    scope: [''],
    accessTokenExpiresAt: 0,
    refreshTokenExpiresAt: 0
  };

  private readonly rolePrototype: Role = {
    id: 'proto',
    name: '',
    dateCreated: Date.now(),
    deleted: false,
    privileges: [Privilege.DEPOSIT],
    isAdmin: false
  };

  private readonly clientPrototype: AccessClient = {
    id: 'proto',
    dateCreated: Date.now(),
    deleted: false,
    clientId: '',
    clientSecret: '',
    name: '',
    redirectUris: [''],
    grants: ['']
  };

  private readonly productPrototype: Product = {
    id: 'proto',
    dateCreated: Date.now(),
    deleted: false,
    productName: '',
    productDescription: '',
    amountAvailable: 0,
    cost: { value: 0, unit: 'cents', currency: 'EUR' },
    sellerId: ''
  };

  private readonly purchasePrototype: Purchase = {
    id: 'proto',
    dateCreated: Date.now(),
    deleted: false,
    productId: '',
    buyerId: '',
    sellerId: '',
    amount: { value: 0, unit: 'cents', currency: 'EUR' },
    status: PurchaseStatus.PENDING
  };

  private readonly mongoConnectionOptions = {
    bufferCommands: false
  };

  private userRepository: TransactionalCrudRepository<User> | undefined;
  private tokenRepository: TransactionalCrudRepository<AccessToken> | undefined;
  private roleRepository: TransactionalCrudRepository<Role> | undefined;
  private clientRepository:
    | TransactionalCrudRepository<AccessClient>
    | undefined;
  private productRepository: TransactionalCrudRepository<Product> | undefined;
  private purchaseRepository: TransactionalCrudRepository<Purchase> | undefined;

  private userService: UserService | undefined;
  private roleService: RoleService | undefined;
  private tokenService: TokenService | undefined;
  private productService: ProductService | undefined;
  private purchaseService: PurchaseService | undefined;
  private accessClientService: AccessClientService | undefined;

  private authHandler: Oauth2AuthHandler | undefined;
  private userHandler: UserHandler | undefined;
  private productHandler: ProductHandler | undefined;
  private purchaseHandler: PurchaseHandler | undefined;
  private authorizationHandler: AuthorizationHandler | undefined;
  private roleHandler: RoleHandler | undefined;
  private startupHandler:
    | GenericHandler<void, Promise<StartupResponse>>
    | undefined;

  private constructor() {
    logger.info('ModuleFactory > constructor: ', this.mongoUri);
  }

  public static get getAuthHandler(): Oauth2AuthHandler {
    logger.info('getAuthHandler');
    if (this.getInstance.authHandler) return this.getInstance.authHandler;
    logger.info('Creating getAuthHandler');
    return (this.getInstance.authHandler = oauth2Handler(
      this.getUserService,
      this.getTokenService,
      this.getAccessClientService,
      this.getRoleService
    ));
  }

  public static get getAuthorizationHandler(): AuthorizationHandler {
    if (this.getInstance.authorizationHandler)
      return this.getInstance.authorizationHandler;
    return (this.getInstance.authorizationHandler = authorizationHandler(
      this.getTokenService,
      this.getAccessClientService,
      this.getProductService,
      this.getUserService,
      this.getRoleService
    ));
  }

  public static get getUserHandler(): UserHandler {
    if (this.getInstance.userHandler) return this.getInstance.userHandler;
    return (this.getInstance.userHandler = userAccountHandler(
      this.getUserService
    ));
  }

  public static get getProductHandler(): ProductHandler {
    if (this.getInstance.productHandler) return this.getInstance.productHandler;
    return (this.getInstance.productHandler = productAccountHandler(
      this.getProductService,
      this.getPurchaseService
    ));
  }

  public static get getPurchaseHandler(): PurchaseHandler {
    if (this.getInstance.purchaseHandler)
      return this.getInstance.purchaseHandler;
    return (this.getInstance.purchaseHandler = purchaseAccountHandler(
      this.getPurchaseService
    ));
  }

  public static get getRoleHandler(): RoleHandler {
    if (this.getInstance.roleHandler) return this.getInstance.roleHandler;
    return (this.getInstance.roleHandler = roleRequestHandler(
      this.getRoleService
    ));
  }

  public static get getStartupHandler(): GenericHandler<
    void,
    Promise<StartupResponse>
  > {
    if (this.getInstance.startupHandler) return this.getInstance.startupHandler;
    return (this.getInstance.startupHandler = startupHandler(
      this.getRoleService,
      this.getAccessClientService,
      this.getUserService
    ));
  }

  public static get getRoleRepository(): TransactionalCrudRepository<Role> {
    if (this.getInstance.roleRepository) return this.getInstance.roleRepository;
    return (this.getInstance.roleRepository = MongoCrudRepository.initFor<Role>(
      'roles',
      {
        entities: [{ roles: this.getInstance.rolePrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || '',
        connectionOptions: this.getInstance.mongoConnectionOptions
      }
    ));
  }

  public static get getTokenRepository(): TransactionalCrudRepository<AccessToken> {
    if (this.getInstance.tokenRepository) {
      return this.getInstance.tokenRepository;
    }
    return (this.getInstance.tokenRepository =
      MongoCrudRepository.initFor<AccessToken>('accessTokens', {
        entities: [{ accessTokens: this.getInstance.accessTokenPrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || '',
        connectionOptions: this.getInstance.mongoConnectionOptions
      }));
  }

  public static get getUserRepository(): TransactionalCrudRepository<User> {
    if (this.getInstance.userRepository) return this.getInstance.userRepository;
    return (this.getInstance.userRepository = MongoCrudRepository.initFor<User>(
      'users',
      {
        entities: [{ users: this.getInstance.userPrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || '',
        connectionOptions: this.getInstance.mongoConnectionOptions
      }
    ));
  }

  public static get getClientRepository(): TransactionalCrudRepository<AccessClient> {
    if (this.getInstance.clientRepository) {
      return this.getInstance.clientRepository;
    }

    return (this.getInstance.clientRepository =
      MongoCrudRepository.initFor<AccessClient>('accessClients', {
        entities: [{ accessClients: this.getInstance.clientPrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || '',
        connectionOptions: this.getInstance.mongoConnectionOptions
      }));
  }

  public static get getProductRepository(): TransactionalCrudRepository<Product> {
    if (this.getInstance.productRepository) {
      return this.getInstance.productRepository;
    }

    return (this.getInstance.productRepository =
      MongoCrudRepository.initFor<Product>('products', {
        entities: [{ products: this.getInstance.productPrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || '',
        connectionOptions: this.getInstance.mongoConnectionOptions
      }));
  }

  public static get getPurchaseRepository(): TransactionalCrudRepository<Purchase> {
    if (this.getInstance.purchaseRepository) {
      return this.getInstance.purchaseRepository;
    }

    return (this.getInstance.purchaseRepository =
      MongoCrudRepository.initFor<Purchase>('purchases', {
        entities: [{ purchases: this.getInstance.purchasePrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || '',
        connectionOptions: this.getInstance.mongoConnectionOptions
      }));
  }

  public static get getTokenService(): TokenService {
    if (this.getInstance.tokenService) return this.getInstance.tokenService;
    return (this.getInstance.tokenService = new TokenService(
      this.getTokenRepository,
      this.getAccessClientService
    ));
  }

  public static get getAccessClientService(): AccessClientService {
    if (this.getInstance.accessClientService)
      return this.getInstance.accessClientService;
    return (this.getInstance.accessClientService = new AccessClientService(
      this.getClientRepository
    ));
  }

  public static get getRoleService(): RoleService {
    if (this.getInstance.roleService) return this.getInstance.roleService;
    return (this.getInstance.roleService = new RoleService(
      this.getRoleRepository
    ));
  }

  public static get getUserService(): UserService {
    if (this.getInstance.userService) return this.getInstance.userService;
    return (this.getInstance.userService = new UserService(
      this.getUserRepository,
      this.getRoleService,
      this.getAccessClientService
    ));
  }

  public static get getProductService(): ProductService {
    if (this.getInstance.productService) return this.getInstance.productService;
    return (this.getInstance.productService = new ProductService(
      this.getProductRepository,
      this.getUserService
    ));
  }

  public static get getPurchaseService(): PurchaseService {
    if (this.getInstance.purchaseService) {
      return this.getInstance.purchaseService;
    }

    return (this.getInstance.purchaseService = new PurchaseService(
      this.getPurchaseRepository,
      this.getUserService,
      this.getProductService
    ));
  }

  private static get getInstance(): ModuleFactory {
    return this.instance || (this.instance = new this());
  }
}

export { ModuleFactory };
