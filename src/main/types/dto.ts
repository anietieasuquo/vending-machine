import { Amount, CompositeAmount, PurchaseStatus } from '@main/types/store';

export interface UserRequest {
  username: string;
  password: string;
  deposit: Amount;
  roleId: string;
  machineId: string;
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
  productName: string;
  productDescription?: string | undefined;
  amountAvailable: number;
  cost: Amount;
  sellerId: string;
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
  productId: string;
  userId: string;
  quantity: number;
}

export interface CreatePurchaseResponse {
  totalSpent: Amount;
  change: CompositeAmount;
  product: ProductDto;
}

export interface PurchaseDto {
  transactionId: string;
  productId: string;
  userId: string;
  amount: Amount;
  dateCreated: number;
  dateUpdated?: number | undefined;
  status: PurchaseStatus;
}

export interface GenericResponse<T> {
  success: boolean;
  data: T;
}

export interface MakeDepositRequest {
  amount: Amount;
}

export interface ErrorResponse {
  message: string;
  code: number;
  timestamp: string;
  path: string;
}
