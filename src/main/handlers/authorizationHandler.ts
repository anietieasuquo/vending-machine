import { NextFunction, Request, Response } from 'express';
import {
  AuthorizationHandler,
  PermissionsConfig,
  WebRequestHandlerParams
} from '@main/types/web';
import { TokenService } from '@main/services/TokenService';
import { commonUtils, logger, Objects } from 'tspa';
import { NotFoundException } from '@main/exception/NotFoundException';
import { AccessForbiddenException } from '@main/exception/AccessForbiddenException';
import { ProductService } from '@main/services/ProductService';
import { errorHandler } from '@main/handlers/requestHandler';
import { AccessClient, AccessToken, Product } from '@main/types/store';
import { UserService } from '@main/services/UserService';
import { RoleService } from '@main/services/RoleService';
import { AccessClientService } from '@main/services/AccessClientService';

let tokenService: TokenService;
let productService: ProductService;
let userService: UserService;
let roleService: RoleService;
let accessClientService: AccessClientService;

const checkProductPermissions = async (
  productId: string,
  userId: string
): Promise<void> => {
  logger.info('Authorization handler > Checking product permissions:', {
    productId,
    userId
  });
  const product: Product = (
    await productService.findProductById(productId)
  ).orElseThrow(new NotFoundException('Product not found'));

  if (product.sellerId !== userId) {
    logger.warn('Authorization handler > Unauthorized product access:', {
      productId,
      userId
    });
    throw new AccessForbiddenException('Forbidden');
  }

  logger.info('Authorization handler > Product permissions granted:', {
    productId,
    userId,
    sellerId: product.sellerId
  });
};

const isPermissionsGranted = async (
  request: Request,
  requestedPermissionsConfig: PermissionsConfig
): Promise<boolean> => {
  const {
    roles = [],
    onlyOwner = false,
    entityName
  } = requestedPermissionsConfig;
  if (roles.length === 0 && !onlyOwner) {
    logger.warn(
      'Authorization handler > No permissions required for endpoint:',
      { url: request.url }
    );
    return true;
  }

  const authorization: string = request.headers.authorization || '';
  if (commonUtils.isEmpty(authorization)) {
    logger.warn('Authorization handler > authorization empty:', {
      url: request.url
    });
    throw new AccessForbiddenException('Unauthorized');
  }

  const token: string = authorization.split(' ')[1];
  if (commonUtils.isEmpty(token)) {
    logger.warn('Authorization handler > token empty:', { url: request.url });
    throw new AccessForbiddenException('Unauthorized');
  }

  const authToken: AccessToken = (
    await tokenService.findToken(token)
  ).orElseThrow(new AccessForbiddenException('Unauthorized'));

  const { clientId, type, accessToken, refreshToken, userId } = authToken;

  const client: AccessClient = (
    await accessClientService.findSecretBy({ clientId })
  ).orElseThrow(new AccessForbiddenException('Unauthorized'));

  const actualToken = type === 'access' ? accessToken : refreshToken;
  Objects.requireNonEmpty(
    actualToken,
    new AccessForbiddenException('Unauthorized')
  );

  const user = (await userService.findUserById(userId)).orElseThrow(
    new AccessForbiddenException('Unauthorized')
  );

  if (user.machineId !== client.id) {
    logger.warn('Authorization handler > Unauthorized machine access:', {
      machineId: client.id,
      userId: user.id
    });
    throw new AccessForbiddenException('Unauthorized');
  }

  const role = (await roleService.findRoleById(user.roleId)).orElseThrow(
    new AccessForbiddenException('Unauthorized')
  );

  // Admins have access to all GET endpoints
  if (role.isAdmin && request.method.toLowerCase() === 'get') {
    logger.info('Authorization handler > Admin access granted:', {
      url: request.url
    });
    return true;
  }

  // All other user checks are based on the scope
  if (roles.length > 0) {
    const scope: string[] = (
      Array.isArray(authToken.scope) ? authToken.scope : []
    ).map((s) => s.toLowerCase());

    logger.info('Authorization handler > Checking scope:', { scope, roles });

    if (!scope.some((s) => roles.includes(s.toLowerCase()))) {
      logger.warn('Authorization handler > Unauthorized scope:', {
        scope,
        roles
      });
      throw new AccessForbiddenException('Unauthorized');
    }
  }

  logger.info('Authorization handler > Checking owner permissions:', {
    onlyOwner,
    entityName
  });
  if (onlyOwner) {
    switch (entityName) {
      case 'product':
        await checkProductPermissions(request.params.id, authToken.userId);
        break;
      case 'user':
        Objects.requireTrue(
          request.params.id === authToken.userId,
          new AccessForbiddenException('Forbidden')
        );
        break;
      default:
        break;
    }
  }

  logger.info('Authorization handler > Permissions granted:', {
    url: request.url
  });

  return true;
};

const verifyPermissions = (
  permissionsConfig: PermissionsConfig
): WebRequestHandlerParams => {
  return async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      response.req.url = request.originalUrl;

      logger.info('Authorizing access to endpoint:', request.originalUrl);
      const granted = await isPermissionsGranted(request, permissionsConfig);
      Objects.requireTrue(granted, new AccessForbiddenException('Forbidden'));

      logger.info(
        'Authorization successful for endpoint:',
        request.originalUrl
      );
    } catch (error: any) {
      return errorHandler(error, request, response, next);
    }
    next();
  };
};

export default (
  injectedTokenService: TokenService,
  injectedAccessClientService: AccessClientService,
  injectedProductService: ProductService,
  injectedUserService: UserService,
  injectedRoleService: RoleService
): AuthorizationHandler => {
  tokenService = injectedTokenService;
  accessClientService = injectedAccessClientService;
  productService = injectedProductService;
  userService = injectedUserService;
  roleService = injectedRoleService;

  return {
    verifyPermissions
  };
};
