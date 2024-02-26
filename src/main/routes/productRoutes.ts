import { AuthorizationHandler, ProductHandler } from '@main/types/web';
import { Router } from 'express';

export default (
  router: Router,
  app: any,
  authorizationHandler: AuthorizationHandler,
  productHandler: ProductHandler
): Router => {
  router.post(
    '/',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({ roles: ['seller'] }),
    productHandler.createProduct
  );
  router.get('/', app.oauth.authenticate(), productHandler.fetchAllProducts);
  router.get('/:id', app.oauth.authenticate(), productHandler.fetchProductById);
  router.put(
    '/:id',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      roles: ['seller'],
      onlyOwner: true
    }),
    productHandler.updateProduct
  );
  router.delete(
    '/:id',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      roles: ['seller'],
      onlyOwner: true
    }),
    productHandler.deleteProduct
  );
  return router;
};
