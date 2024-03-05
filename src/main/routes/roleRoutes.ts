import { Router } from 'express';
import { AuthorizationHandler, RoleHandler } from '@main/types/web';

export default (
  router: Router,
  app: any,
  authorizationHandler: AuthorizationHandler,
  roleHandler: RoleHandler
): Router => {
  /**
   * @swagger
   * /purchases: Fetch all roles
   */
  router.get(
    '/',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({ roles: ['admin'] }),
    roleHandler.getRoles
  );
  return router;
};
