import { AuthorizationHandler, UserHandler } from '@main/types/web';
import { Router } from 'express';

export default (
  router: Router,
  app: any,
  authorizationHandler: AuthorizationHandler,
  userHandler: UserHandler
): Router => {
  /**
   * @swagger
   * /users for creating a new user (buyers and sellers)
   */
  router.post('/', userHandler.createUser);

  /**
   * @swagger
   * /users/admin for creating a new admin user. Can only be created by an existing admin user.
   */
  router.post(
    '/admin',
    authorizationHandler.verifyPermissions({
      roles: ['admin']
    }),
    userHandler.createAdmin
  );

  /**
   * @swagger
   * /users for fetching all users. Can only be accessed by an admin user.
   */
  router.get(
    '/',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      roles: ['admin']
    }),
    userHandler.fetchAllUsers
  );

  /**
   * @swagger
   * /users/{id} for fetching a user by id. Can only be accessed by the user themselves.
   */
  router.get(
    '/:id',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      onlyOwner: true,
      entityName: 'user'
    }),
    userHandler.fetchUserById
  );

  /**
   * @swagger
   * /users/{id}/deposit for making a deposit. Can only be accessed by the user themselves.
   */
  router.post(
    '/:id/deposits',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      roles: ['buyer'],
      onlyOwner: true,
      entityName: 'user'
    }),
    userHandler.makeDeposit
  );

  /**
   * @swagger
   * /users/{id}/deposit/reset for resetting a deposit. Can only be accessed by the user themselves.
   */
  router.post(
    '/:id/deposits/reset',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      roles: ['buyer'],
      onlyOwner: true,
      entityName: 'user'
    }),
    userHandler.resetDeposit
  );

  /**
   * @swagger
   * /users/{id}/password for changing a password. Can only be accessed by the user themselves.
   */
  router.patch(
    '/:id/password',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      onlyOwner: true,
      entityName: 'user'
    }),
    userHandler.changePassword
  );

  /**
   * @swagger
   * /users/{id}/roles for updating a user's role. Can only be accessed by an admin user.
   */
  router.patch(
    '/:id/roles',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({ roles: ['admin'] }),
    userHandler.updateRole
  );

  /**
   * @swagger
   * /users/{id} for deleting a user. Can only be accessed by the user themselves.
   */
  router.delete(
    '/:id',
    app.oauth.authenticate(),
    authorizationHandler.verifyPermissions({
      onlyOwner: true,
      entityName: 'user'
    }),
    userHandler.deleteUser
  );
  return router;
};
