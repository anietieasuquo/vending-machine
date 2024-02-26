import { Request, Response } from 'express';
import { PurchaseHandler } from '@main/types/web';
import { CreatePurchaseResponse, PurchaseRequest } from '@main/types/dto';
import { commonUtils, logger } from 'tspa';
import { PurchaseService } from '@main/services/PurchaseService';
import { executeRequest } from '@main/handlers/requestHandler';

let purchaseService: PurchaseService;

const createPurchase = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<CreatePurchaseResponse>(
    async () => {
      logger.info('Creating purchase:', request.body);
      const { productId, userId, quantity }: PurchaseRequest = request.body;
      if (commonUtils.isAnyEmpty(productId, userId, quantity)) {
        throw new Error('Invalid purchase data');
      }

      const purchaseResponse: CreatePurchaseResponse =
        await purchaseService.createPurchase(request.body as PurchaseRequest);

      logger.info('Purchase created:', purchaseResponse);

      return purchaseResponse;
    },
    201,
    response,
    request
  );
};

export default (injectedPurchaseService: PurchaseService): PurchaseHandler => {
  purchaseService = injectedPurchaseService;

  return {
    createPurchase
  };
};
