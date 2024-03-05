import { NextFunction, Request, Response } from 'express';
import { UserDto } from '@main/types/dto';

export interface OAuth2AccessClient {
  id: string;
  machineId: string;
  secret: string;
  redirectUris: string | string[] | undefined;
  accessTokenLifetime?: number | undefined;
  refreshTokenLifetime?: number | undefined;
  grants: string | string[];

  [key: string]: any;
}

export interface OAuth2Token {
  client?: OAuth2AccessClient;
  user?: UserDto;
  scope?: string[];

  [key: string]: any;
}

export interface OAuth2AccessToken extends OAuth2Token {
  accessToken: string;
  accessTokenExpiresAt?: Date | undefined;
}

export interface OAuth2RefreshToken extends OAuth2Token {
  refreshToken: string;
  refreshTokenExpiresAt?: Date | undefined;
}

export type OAuth2Tokens = OAuth2AccessToken & OAuth2RefreshToken;

export interface UserHandler {
  createUser: (request: Request, response: Response) => Promise<void>;
  createAdmin: (request: Request, response: Response) => Promise<void>;
  fetchUserById: (request: Request, response: Response) => Promise<void>;
  fetchAllUsers: (request: Request, response: Response) => Promise<void>;
  makeDeposit: (request: Request, response: Response) => Promise<void>;
  resetDeposit: (request: Request, response: Response) => Promise<void>;
  updateRole: (request: Request, response: Response) => Promise<void>;
  changePassword: (request: Request, response: Response) => Promise<void>;
  deleteUser: (request: Request, response: Response) => Promise<void>;
}

export interface ProductHandler {
  createProduct: (request: Request, response: Response) => Promise<void>;
  fetchProductById: (request: Request, response: Response) => Promise<void>;
  fetchAllProducts: (request: Request, response: Response) => Promise<void>;
  updateProduct: (request: Request, response: Response) => Promise<void>;
  makePurchase: (request: Request, response: Response) => Promise<void>;
  fetchPurchasesByProductId: (
    request: Request,
    response: Response
  ) => Promise<void>;
  deleteProduct: (request: Request, response: Response) => Promise<void>;
}

export interface RequestHandler {
  executeRequest: <R>(
    executor: () => Promise<R>,
    status: number,
    response: Response,
    request: Request,
    requiredPermissions?: PermissionsConfig | undefined
  ) => Promise<Response>;
  errorHandler: (
    error: any,
    request: Request,
    response: Response,
    next: any
  ) => any;
}

export interface PurchaseHandler {
  getPurchases: (request: Request, response: Response) => Promise<void>;
}

export interface RoleHandler {
  getRoles: (request: Request, response: Response) => Promise<void>;
}

export interface GenericHandler<A, R> {
  run: (arg?: A) => R;
}

export interface Oauth2AuthHandler {
  getClient: (
    clientId: string,
    clientSecret: string
  ) => Promise<OAuth2AccessClient | undefined>;
  saveToken: (
    token: Partial<OAuth2Tokens>,
    client: OAuth2AccessClient,
    user: UserDto
  ) => Promise<OAuth2Tokens>;
  getAccessToken: (
    accessToken: string
  ) => Promise<OAuth2AccessToken | undefined>;
  getRefreshToken: (
    refreshToken: string
  ) => Promise<OAuth2RefreshToken | undefined>;
  generateAccessToken: (
    client: OAuth2AccessClient,
    user: UserDto,
    scope: string[]
  ) => Promise<string>;
  generateRefreshToken: (
    client: OAuth2AccessClient,
    user: UserDto,
    scope: string[]
  ) => Promise<string>;
  revokeToken: (refreshToken: OAuth2RefreshToken) => Promise<boolean>;
  validateScope: (
    user: UserDto,
    client: OAuth2AccessClient,
    scope: string | string[]
  ) => Promise<string[] | undefined>;
  verifyScope: (
    token: OAuth2AccessToken,
    scope: string | string[]
  ) => Promise<boolean>;
  getUser: (
    username: string,
    password: string,
    client: OAuth2AccessClient
  ) => Promise<UserDto | undefined>;
  getUserFromClient: (
    client: OAuth2AccessClient
  ) => Promise<UserDto | undefined>;
}

export type WebRequestHandlerParams = (
  request: Request,
  response: Response,
  next: NextFunction
) => Promise<void>;

export interface AuthorizationHandler {
  verifyPermissions: (
    requiredPermissionsConfig: PermissionsConfig
  ) => WebRequestHandlerParams;
}

export interface PermissionsConfig {
  roles?: string[];
  onlyOwner?: boolean;
  entityName?: 'product' | 'user' | 'role' | 'purchase';
}
