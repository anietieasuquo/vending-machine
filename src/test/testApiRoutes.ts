import { Router } from 'express';

export default (router: Router, app: any, testAPIService: any) => {
  router.post('/hello', app.oauth.authenticate(), testAPIService);
  return router;
};
