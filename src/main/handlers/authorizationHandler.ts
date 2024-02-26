import { NextFunction, Request, Response } from 'express';
import {
  AuthorizationHandler,
  PermissionsConfig,
  WebRequestHandlerParams
} from '@main/types/web';
import { TokenService } from '@main/services/TokenService';
import { commonUtils, logger } from 'tspa';
import { AuthenticationException } from '@main/exception/AuthenticationException';
import { NotFoundException } from '@main/exception/NotFoundException';
import { AccessForbiddenException } from '@main/exception/AccessForbiddenException';
import { ProductService } from '@main/services/ProductService';
import { errorHandler } from '@main/handlers/requestHandler';

let tokenService: TokenService;
let productService: ProductService;

const checkProductPermissions = async (
  productId: string,
  userId: string
): Promise<void> => {
  const product = await productService.findProductById(productId);
  if (!product) {
    logger.warn('Product not found:', { productId });
    throw new NotFoundException('Product not found');
  }

  if (product.sellerId !== userId) {
    logger.warn('Unauthorized product access:', { productId, userId });
    throw new AccessForbiddenException('Forbidden');
  }
};

const isPermissionsGranted = async (
  request: Request,
  requestedPermissionsConfig: PermissionsConfig
): Promise<boolean> => {
  const {
    privileges = [],
    roles = [],
    onlyOwner = false,
    entityName
  } = requestedPermissionsConfig;
  if (privileges.length === 0 && roles.length === 0) {
    logger.warn('No permissions required for endpoint:', { url: request.url });
    return true;
  }

  const authorization: string = request.headers.authorization || '';
  if (commonUtils.isEmpty(authorization)) {
    throw new AuthenticationException('Unauthorized');
  }

  const token: string = authorization.split(' ')[1];
  if (commonUtils.isEmpty(token)) {
    throw new AuthenticationException('Unauthorized');
  }

  const authToken = await tokenService.findToken(token);
  if (!authToken || commonUtils.isEmpty(authToken)) {
    logger.warn('Token not found:', { token });
    throw new AuthenticationException('Unauthorized');
  }

  const { clientId, type, accessToken, refreshToken } = authToken;

  const client = await tokenService.findSecretBy({ clientId });
  if (!client || commonUtils.isEmpty(client)) {
    logger.warn('Client not found:', { clientId });
    throw new AuthenticationException('Unauthorized');
  }

  const actualToken = type === 'access' ? accessToken : refreshToken;
  if (!actualToken || commonUtils.isEmpty(actualToken)) {
    logger.warn('Invalid token:', { token });
    throw new AuthenticationException('Unauthorized');
  }

  if (onlyOwner) {
    switch (entityName) {
      case 'product':
        await checkProductPermissions(request.params.id, authToken.userId);
        break;
      default:
        break;
    }
  }

  if (roles.length > 0) {
    const scope: string[] = (
      Array.isArray(authToken.scope) ? authToken.scope : []
    ).map((s) => s.toLowerCase());

    return scope.some((s) => roles.includes(s.toLowerCase()));
  }

  return false;
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
      response.req.url = request.url;

      logger.info('Authorizing access to endpoint:', request.url);
      const granted = await isPermissionsGranted(request, permissionsConfig);

      if (!granted) {
        logger.warn('Insufficient permissions for endpoint:', request.url);
        throw new AccessForbiddenException('Access forbidden');
      }

      logger.info('Authorization successful for endpoint:', request.url);
    } catch (error: any) {
      return errorHandler(error, request, response, next);
    }
    next();
  };
};

export default (
  injectedTokenService: TokenService,
  injectedProductService: ProductService
): AuthorizationHandler => {
  tokenService = injectedTokenService;
  productService = injectedProductService;

  return {
    verifyPermissions
  };
};
