import { NextFunction, Request, Response } from 'express';
import { ErrorResponse } from '@main/types/dto';
import { logger } from 'tspa';
import { errorMap } from '@main/exception/errorMap';

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
    response.req.url = request.originalUrl;
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
    response.req.url = request.originalUrl;
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
