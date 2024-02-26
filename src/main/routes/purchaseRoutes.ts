import { Router } from 'express';
import { AuthorizationHandler, PurchaseHandler } from '@main/types/web';

export default (
  router: Router,
  app: any,
  authorizationHandler: AuthorizationHandler,
  purchaseHandler: PurchaseHandler
): Router => {
  router.post(
    '/',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({ roles: ['buyer'] }),
    purchaseHandler.createPurchase
  );
  return router;
};
