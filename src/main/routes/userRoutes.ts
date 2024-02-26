import { AuthorizationHandler, UserHandler } from '@main/types/web';
import { Router } from 'express';

export default (
  router: Router,
  app: any,
  authorizationHandler: AuthorizationHandler,
  userHandler: UserHandler
): Router => {
  router.post('/', userHandler.createUser);
  router.get('/user/:id', app.oauth.authenticate(), userHandler.fetchUserById);
  router.post(
    '/:id/deposit',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({ roles: ['buyer'] }),
    userHandler.makeDeposit
  );
  router.patch(
    '/:id/role',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({ roles: ['admin'] }),
    userHandler.updateRole
  );
  router.delete(
    '/:id',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({ roles: ['admin'] }),
    userHandler.deleteUser
  );
  return router;
};
