import express, { Express } from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import OAuth2Server from '@node-oauth/express-oauth-server';
import bodyParser from 'body-parser';
import userRoutes from '@main/routes/userRoutes';
import productRoutes from '@main/routes/productRoutes';
import purchaseRoutes from '@main/routes/purchaseRoutes';
import { ModuleFactory } from '@main/factories/ModuleFactory';
import { errorHandler } from '@main/handlers/requestHandler';
import { api } from '@main/docs/api';
import roleRoutes from '@main/routes/roleRoutes';

dotenv.config();

const app: Express = express();

// @ts-ignore
app.oauth = new OAuth2Server({
  // @ts-expect-error - model may not be the same structure as OAuth2Service but should work
  model: ModuleFactory.getAuthHandler,
  useErrorHandler: true
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const apiPrefix: string = '/api/v1';

// @ts-ignore
app.use(`${apiPrefix}/oauth2/authorize`, app.oauth.token());
app.use(`${apiPrefix}/documentation`, swaggerUi.serve, swaggerUi.setup(api));
app.use(
  `${apiPrefix}/users`,
  userRoutes(
    express.Router(),
    app,
    ModuleFactory.getAuthorizationHandler,
    ModuleFactory.getUserHandler
  )
);

app.use(
  `${apiPrefix}/products`,
  productRoutes(
    express.Router(),
    app,
    ModuleFactory.getAuthorizationHandler,
    ModuleFactory.getProductHandler
  )
);

app.use(
  `${apiPrefix}/purchases`,
  purchaseRoutes(
    express.Router(),
    app,
    ModuleFactory.getAuthorizationHandler,
    ModuleFactory.getPurchaseHandler
  )
);

app.use(
  `${apiPrefix}/roles`,
  roleRoutes(
    express.Router(),
    app,
    ModuleFactory.getAuthorizationHandler,
    ModuleFactory.getRoleHandler
  )
);

app.use(errorHandler);

export { app };
