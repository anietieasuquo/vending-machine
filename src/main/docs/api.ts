import {
  DepositRequest,
  PasswordRequest,
  RoleRequest,
  UserDto,
  userPaths,
  UserRequest,
  userTag
} from '@main/docs/users';
import {
  productPaths,
  ProductRequest,
  productTag,
  PurchaseRequest,
  PurchaseResponse
} from '@main/docs/products';
import {
  AccessTokenRequest,
  AccessTokenResponse,
  authPaths,
  oauth2Tag
} from '@main/docs/oauth2';
import { purchasePaths, purchaseTag } from '@main/docs/purchases';
import {
  allSecurity,
  Amount,
  createErrorBody,
  GenericResponse,
  ProductDto,
  PurchaseDto,
  RoleDto
} from '@main/docs/common';
import { rolePaths, roleTag } from '@main/docs/roles';

const api = {
  openapi: '3.0.1',
  info: {
    version: '1.0.0',
    title: 'Vending Machine API',
    description:
      'A simple API for a vending machine using TSPA (with MongoDB), OAuth2, and ExpressJS.',
    termsOfService:
      'https://github.com/anietieasuquo/vending-machine/blob/main/terms.md',
    contact: {
      name: 'Anietie Asuquo',
      email: 'hello@anietieasuquo.com',
      url: 'https://anietieasuquo.com'
    },
    license: {
      name: 'MIT',
      url: 'https://github.com/anietieasuquo/vending-machine/blob/main/LICENSE'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/',
      description: 'Local Server'
    }
  ],
  tags: [
    {
      name: oauth2Tag
    },
    {
      name: userTag
    },
    {
      name: productTag
    },
    {
      name: purchaseTag
    },
    {
      name: roleTag
    }
  ],
  paths: {
    ...authPaths,
    ...userPaths,
    ...productPaths,
    ...purchasePaths,
    ...rolePaths
  },
  components: {
    securitySchemes: {
      oauth2: {
        type: 'oauth2',
        description:
          'This API uses OAuth 2.0 with the password grant flow.<br />[More about OAuth 2.0](https://oauth.net/2/)<br />[More about the password grant flow](https://oauth.net/2/grant-types/password/)',
        flows: {
          password: {
            tokenUrl: '/api/v1/oauth2/authorize',
            authorizationUrl: '/api/v1/oauth2/authorize',
            refreshUrl: '/api/v1/oauth2/authorize',
            scopes: {
              buyer: 'Make purchases, deposit coins, and view products',
              seller: 'Create and manage products and view purchases',
              admin: 'Create and manage users, products, and roles'
            }
          }
        }
      }
    },
    schemas: {
      AccessTokenRequest,
      UserRequest,
      RoleRequest,
      DepositRequest,
      PasswordRequest,
      ProductRequest,
      PurchaseRequest,
      UserDto,
      ProductDto,
      PurchaseDto,
      RoleDto,
      PurchaseResponse,
      GenericResponse,
      AccessTokenResponse,
      Amount,
      Error: createErrorBody('BadRequestException', 400)
    }
  },
  security: allSecurity
};

export { api };
