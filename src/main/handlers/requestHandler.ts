import { NextFunction, Request, Response } from 'express';
import { ErrorResponse } from '@main/types/dto';
import { logger } from 'tspa';

const errorMap: { [key: string]: number } = {
  PurchaseException: 400,
  AuthenticationException: 401,
  UnauthorizedError: 401,
  InvalidArgumentError: 401,
  InsufficientScopeError: 401,
  InvalidRequestError: 401,
  InvalidTokenError: 401,
  OAuthError: 401,
  UnauthorizedRequestError: 401,
  ServerError: 401,
  InvalidScopeError: 401,
  InvalidClientError: 401,
  InvalidGrantError: 401,
  InvalidClientMetadataError: 401,
  InvalidAuthorizationError: 401,
  InvalidRedirectUriError: 401,
  InvalidClientCredentialsError: 401,
  UnauthorizedClientError: 401,
  InsufficientFundsException: 402,
  AccessForbiddenException: 403,
  NotFoundException: 404,
  OutOfStockException: 409
};

const sendResponse = (
  response: Response,
  status: number,
  message: any
): Response => {
  logger.info('Sending response', { status, message });
  return response.status(status).json(message);
};

const getErrorStatus = (error: any): number => {
  const name = error.constructor.name;
  if (errorMap[name]) return errorMap[name];
  return 400;
};

const getErrorResponse = (error: any, response: Response): ErrorResponse => {
  const code = getErrorStatus(error);
  return {
    message: error.message || 'An error occurred',
    code,
    path: response.req.url,
    timestamp: new Date().toISOString()
  };
};

const executeRequest = async <R>(
  executor: () => Promise<R>,
  status: number,
  response: Response,
  request: Request
): Promise<Response> => {
  try {
    response.req.url = request.url;
    const result: R = await executor();
    return sendResponse(response, status, result);
  } catch (error: any) {
    return sendResponse(
      response,
      getErrorStatus(error),
      getErrorResponse(error, response)
    );
  }
};

const errorHandler = async (
  error: any,
  request: Request,
  response: Response,
  next: NextFunction
): Promise<any> => {
  if (error) {
    logger.error('An error occurred with Express', {
      error,
      name: error.constructor.name
    });
    response.req.url = request.url;
    return sendResponse(
      response,
      getErrorStatus(error),
      getErrorResponse(error, response)
    );
  }
  next(error);
};

export {
  executeRequest,
  errorHandler,
  sendResponse,
  getErrorStatus,
  getErrorResponse
};
