import { Entity } from 'tspa';

export interface BasicAmount {
  unit: string;
  currency: string;
}

export interface Amount extends BasicAmount {
  value: number;
}

export interface CompositeAmount extends BasicAmount {
  value: number[];
}

export interface Product extends Entity {
  productName: string;
  productDescription?: string | undefined;
  amountAvailable: number;
  cost: Amount;
  sellerId: string;
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Purchase extends Entity {
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: Amount;
  status: PurchaseStatus;
}

export interface User extends Entity {
  username: string;
  password: string;
  deposit: Amount;
  roleId: string;
  machineId?: string | undefined;
  isAdmin?: boolean | undefined;
}

export enum Privilege {
  ADD_PRODUCT = 'ADD_PRODUCT',
  UPDATE_PRODUCT = 'UPDATE_PRODUCT',
  DELETE_PRODUCT = 'DELETE_PRODUCT',
  VIEW_PRODUCT = 'VIEW_PRODUCT',
  DEPOSIT = 'DEPOSIT',
  PURCHASE = 'PURCHASE',
  ALL = 'ALL'
}

export interface Role extends Entity {
  name: string;
  privileges: Privilege[];
  isAdmin?: boolean | undefined;
}

export type AccessTokenType = 'access' | 'refresh';

export interface AccessToken extends Entity {
  userId: string;
  clientId: string;
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
  scope: string | string[];
  accessTokenExpiresAt?: number | undefined;
  refreshTokenExpiresAt?: number | undefined;
  type: AccessTokenType;
}

export interface AccessClient extends Entity {
  name: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  grants: string[];
}
