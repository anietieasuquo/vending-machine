import { CrudRepository, logger, MongoCrudRepository } from 'tspa';
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
    username: ''
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
    privileges: [Privilege.DEPOSIT]
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
    userId: '',
    amount: { value: 0, unit: 'cents', currency: 'EUR' },
    status: PurchaseStatus.PENDING
  };

  private userRepository: CrudRepository<User> | undefined;
  private tokenRepository: CrudRepository<AccessToken> | undefined;
  private roleRepository: CrudRepository<Role> | undefined;
  private clientRepository: CrudRepository<AccessClient> | undefined;
  private productRepository: CrudRepository<Product> | undefined;
  private purchaseRepository: CrudRepository<Purchase> | undefined;

  private userService: UserService | undefined;
  private roleService: RoleService | undefined;
  private tokenService: TokenService | undefined;
  private productService: ProductService | undefined;
  private purchaseService: PurchaseService | undefined;

  private authHandler: Oauth2AuthHandler | undefined;
  private userHandler: UserHandler | undefined;
  private productHandler: ProductHandler | undefined;
  private purchaseHandler: PurchaseHandler | undefined;
  private authorizationHandler: AuthorizationHandler | undefined;
  private startupHandler: GenericHandler<void, Promise<void>> | undefined;

  private constructor() {}

  public static get getAuthHandler(): Oauth2AuthHandler {
    logger.info('getAuthHandler');
    if (this.getInstance.authHandler) return this.getInstance.authHandler;
    logger.info('Creating getAuthHandler');
    return (this.getInstance.authHandler = oauth2Handler(
      this.getUserService,
      this.getTokenService,
      this.getRoleService
    ));
  }

  public static get getAuthorizationHandler(): AuthorizationHandler {
    if (this.getInstance.authorizationHandler)
      return this.getInstance.authorizationHandler;
    return (this.getInstance.authorizationHandler = authorizationHandler(
      this.getTokenService,
      this.getProductService
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
      this.getProductService
    ));
  }

  public static get getPurchaseHandler(): PurchaseHandler {
    if (this.getInstance.purchaseHandler)
      return this.getInstance.purchaseHandler;
    return (this.getInstance.purchaseHandler = purchaseAccountHandler(
      this.getPurchaseService
    ));
  }

  public static get getStartupHandler(): GenericHandler<void, Promise<void>> {
    if (this.getInstance.startupHandler) return this.getInstance.startupHandler;
    return (this.getInstance.startupHandler = startupHandler(
      this.getRoleService,
      this.getTokenService
    ));
  }

  public static get getRoleRepository(): CrudRepository<Role> {
    if (this.getInstance.roleRepository) return this.getInstance.roleRepository;
    return (this.getInstance.roleRepository = MongoCrudRepository.initFor<Role>(
      'roles',
      {
        entities: [{ roles: this.getInstance.rolePrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || ''
      }
    ));
  }

  public static get getTokenRepository(): CrudRepository<AccessToken> {
    if (this.getInstance.tokenRepository) {
      return this.getInstance.tokenRepository;
    }
    return (this.getInstance.tokenRepository =
      MongoCrudRepository.initFor<AccessToken>('accessTokens', {
        entities: [{ accessTokens: this.getInstance.accessTokenPrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || ''
      }));
  }

  public static get getUserRepository(): CrudRepository<User> {
    if (this.getInstance.userRepository) return this.getInstance.userRepository;
    return (this.getInstance.userRepository = MongoCrudRepository.initFor<User>(
      'users',
      {
        entities: [{ users: this.getInstance.userPrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || ''
      }
    ));
  }

  public static get getClientRepository(): CrudRepository<AccessClient> {
    if (this.getInstance.clientRepository) {
      return this.getInstance.clientRepository;
    }

    return (this.getInstance.clientRepository =
      MongoCrudRepository.initFor<AccessClient>('accessClients', {
        entities: [{ accessClients: this.getInstance.clientPrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || ''
      }));
  }

  public static get getProductRepository(): CrudRepository<Product> {
    if (this.getInstance.productRepository) {
      return this.getInstance.productRepository;
    }

    return (this.getInstance.productRepository =
      MongoCrudRepository.initFor<Product>('products', {
        entities: [{ products: this.getInstance.productPrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || ''
      }));
  }

  public static get getPurchaseRepository(): CrudRepository<Purchase> {
    if (this.getInstance.purchaseRepository) {
      return this.getInstance.purchaseRepository;
    }

    return (this.getInstance.purchaseRepository =
      MongoCrudRepository.initFor<Purchase>('purchases', {
        entities: [{ purchases: this.getInstance.purchasePrototype }],
        uri: this.getInstance.mongoUri || '',
        appName: this.getInstance.appName || ''
      }));
  }

  public static get getTokenService(): TokenService {
    if (this.getInstance.tokenService) return this.getInstance.tokenService;
    return (this.getInstance.tokenService = new TokenService(
      this.getTokenRepository,
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
      this.getTokenService
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
