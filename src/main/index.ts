import express, { Express, NextFunction, Request, Response } from 'express';
import { logger } from 'tspa';
import dotenv from 'dotenv';
import OAuth2Server from '@node-oauth/express-oauth-server';
import bodyParser from 'body-parser';
import userRoutes from '@main/routes/userRoutes';
import productRoutes from '@main/routes/productRoutes';
import purchaseRoutes from '@main/routes/purchaseRoutes';
import { ModuleFactory } from '@main/factories/ModuleFactory';
import { errorHandler } from '@main/handlers/requestHandler';

dotenv.config();

const port: string | undefined = process.env.PORT;
if (!port) throw new Error('PORT is not defined');
const app: Express = express();

// @ts-ignore
app.oauth = new OAuth2Server({
  // @ts-expect-error - model may not be the same structure as OAuth2Service but should work
  model: ModuleFactory.getAuthHandler,
  useErrorHandler: true
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// @ts-ignore
app.use('/oauth2/authorize', app.oauth.token());
app.use(
  '/users',
  userRoutes(
    express.Router(),
    app,
    ModuleFactory.getAuthorizationHandler,
    ModuleFactory.getUserHandler
  )
);

app.use(
  '/products',
  productRoutes(
    express.Router(),
    app,
    ModuleFactory.getAuthorizationHandler,
    ModuleFactory.getProductHandler
  )
);

app.use(
  '/purchase',
  purchaseRoutes(
    express.Router(),
    app,
    ModuleFactory.getAuthorizationHandler,
    ModuleFactory.getPurchaseHandler
  )
);

app.use(errorHandler);

ModuleFactory.getStartupHandler
  .handle()
  .then(() => logger.info('Startup complete'));

app.listen(port, () => {
  return logger.info(`Express is listening at http://localhost:${port}`);
});
