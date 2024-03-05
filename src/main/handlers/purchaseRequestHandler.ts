import { Request, Response } from 'express';
import { PurchaseHandler } from '@main/types/web';
import { PurchaseDto } from '@main/types/dto';
import { logger } from 'tspa';
import { PurchaseService } from '@main/services/PurchaseService';
import { executeRequest } from '@main/handlers/requestHandler';
import { fromPurchaseToPurchaseDto } from '@main/util/mapper';
import { Purchase } from '@main/types/store';

let purchaseService: PurchaseService;

const getPurchases = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<PurchaseDto[]>(
    async () => {
      logger.info('Fetching purchases:');

      const purchases: Purchase[] = await purchaseService.getPurchases();
      return purchases.map(fromPurchaseToPurchaseDto);
    },
    200,
    response,
    request
  );
};

export default (injectedPurchaseService: PurchaseService): PurchaseHandler => {
  purchaseService = injectedPurchaseService;

  return {
    getPurchases
  };
};
