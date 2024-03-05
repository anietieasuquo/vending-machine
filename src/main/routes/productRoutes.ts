import { AuthorizationHandler, ProductHandler } from '@main/types/web';
import { Router } from 'express';

export default (
  router: Router,
  app: any,
  authorizationHandler: AuthorizationHandler,
  productHandler: ProductHandler
): Router => {
  /**
   * @swagger
   * /products: creates a new product for the seller
   */
  router.post(
    '/',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({ roles: ['seller'] }),
    productHandler.createProduct
  );

  /**
   * @swagger
   * /products: fetches all products
   */
  router.get('/', app.oauth.authenticate(), productHandler.fetchAllProducts);

  /**
   * @swagger
   * /products/{id}: fetches a product by id
   */
  router.get('/:id', app.oauth.authenticate(), productHandler.fetchProductById);

  /**
   * @swagger
   * /products/{id}: updates a product by id
   */
  router.put(
    '/:id',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      roles: ['seller'],
      onlyOwner: true,
      entityName: 'product'
    }),
    productHandler.updateProduct
  );

  /**
   * @swagger
   * /products/{id}/buy: buy a product
   */
  router.post(
    '/:id/buy',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({ roles: ['buyer'] }),
    productHandler.makePurchase
  );

  /**
   * @swagger
   * /products/{id}/purchases: fetches all purchases for a product
   */
  router.get(
    '/:id/purchases',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      roles: ['seller'],
      onlyOwner: true,
      entityName: 'product'
    }),
    productHandler.fetchPurchasesByProductId
  );

  /**
   * @swagger
   * /products/{id}: deletes a product by id
   */
  router.delete(
    '/:id',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      roles: ['seller'],
      onlyOwner: true,
      entityName: 'product'
    }),
    productHandler.deleteProduct
  );
  return router;
};
