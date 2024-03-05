import { AccessClient, Product, Purchase, Role, User } from '@main/types/store';
import { ProductDto, PurchaseDto, RoleDto, UserDto } from '@main/types/dto';
import { OAuth2AccessClient } from '@main/types/web';

const fromUserToUserDto = (user: User): UserDto => {
  const { id, machineId, username, deposit, roleId, dateCreated, dateUpdated } =
    user;
  return {
    id: id!,
    machineId: machineId!,
    username,
    deposit,
    roleId,
    dateCreated: dateCreated!,
    dateUpdated: dateUpdated!
  };
};

const fromProductToProductDto = (product: Product): ProductDto => {
  return {
    id: product.id!,
    productName: product.productName,
    productDescription: product.productDescription,
    amountAvailable: product.amountAvailable,
    cost: product.cost,
    sellerId: product.sellerId,
    dateCreated: product.dateCreated!,
    dateUpdated: product.dateUpdated!
  };
};

const fromAccessClientToOAuth2AccessClient = (
  accessClient: AccessClient
): OAuth2AccessClient => {
  const { id, clientId, clientSecret, grants, redirectUris } = accessClient;
  return {
    id: clientId,
    machineId: id!,
    secret: clientSecret,
    grants,
    redirectUris
  };
};

const fromPurchaseToPurchaseDto = (purchase: Purchase): PurchaseDto => {
  const { id, productId, buyerId, sellerId, amount, status, dateCreated } =
    purchase;
  return {
    id: id!,
    productId,
    buyerId,
    sellerId,
    amount,
    status,
    dateCreated: dateCreated!
  };
};

const fromRoleToRoleDto = (role: Role): RoleDto => {
  const { id, name, privileges, dateCreated, dateUpdated } = role;
  return {
    id: id!,
    name,
    privileges,
    dateCreated: dateCreated!,
    dateUpdated: dateUpdated!
  };
};

export {
  fromUserToUserDto,
  fromProductToProductDto,
  fromAccessClientToOAuth2AccessClient,
  fromPurchaseToPurchaseDto,
  fromRoleToRoleDto
};
