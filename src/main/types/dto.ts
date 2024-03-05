import {
  AccessClient,
  Amount,
  CompositeAmount,
  Privilege,
  PurchaseStatus,
  Role,
  User
} from '@main/types/store';

export interface UserRequest {
  username: string;
  password: string;
  deposit?: Amount;
  role: string;
  machine: string;
}

export interface UserDto {
  id: string;
  machineId: string;
  username: string;
  deposit: Amount;
  roleId: string;
  dateCreated: number;
  dateUpdated?: number | undefined;
}

export interface ProductRequest {
  productName?: string;
  productDescription?: string | undefined;
  amountAvailable?: number;
  cost?: Amount;
  sellerId?: string | undefined;
}

export interface ProductDto {
  id: string;
  productName: string;
  productDescription?: string | undefined;
  amountAvailable: number;
  cost: Amount;
  sellerId: string;
  dateCreated: number;
  dateUpdated?: number | undefined;
}

export interface PurchaseRequest {
  userId: string;
  quantity: number;
}

export interface PurchaseResponse {
  id: string;
  buyerId: string;
  totalSpent: Amount;
  change: CompositeAmount;
  product: ProductDto;
  dateCreated: number;
}

export interface PurchaseDto {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: Amount;
  status: PurchaseStatus;
  dateCreated: number;
  dateUpdated?: number | undefined;
}

export interface PurchaseFilter {
  productId?: string;
  userId?: string;
  amount?: Amount;
  status?: PurchaseStatus;
  dateCreated?: number;
  dateUpdated?: number | undefined;
}

export interface RoleDto {
  id: string;
  name: string;
  privileges: Privilege[];
  dateCreated: number;
  dateUpdated?: number | undefined;
}

export interface GenericResponse<T> {
  success: boolean;
  data: T;
}

export interface DepositRequest {
  amount: Amount;
}

export interface ErrorResponse {
  message: string;
  code: number;
  timestamp: string;
  path: string;
}

export interface StartupResponse {
  roles: Role[];
  accessClient: AccessClient;
  admin: User;
}
