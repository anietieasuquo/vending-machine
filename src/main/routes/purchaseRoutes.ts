import { Router } from 'express';
import { AuthorizationHandler, PurchaseHandler } from '@main/types/web';

export default (
  router: Router,
  app: any,
  authorizationHandler: AuthorizationHandler,
  purchaseHandler: PurchaseHandler
): Router => {
  /**
   * @swagger
   * /purchases: Fetch all purchases
   */
  router.get(
    '/',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({ roles: ['admin'] }),
    purchaseHandler.getPurchases
  );
  return router;
};
