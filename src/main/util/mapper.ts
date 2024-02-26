import { AccessClient, Product, User } from '@main/types/store';
import { ProductDto, UserDto } from '@main/types/dto';
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

export {
  fromUserToUserDto,
  fromProductToProductDto,
  fromAccessClientToOAuth2AccessClient
};
