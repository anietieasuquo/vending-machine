import request from 'supertest';
import { app } from '../main/server';

const fetchOAuthToken = async ({
  clientId,
  clientSecret,
  username,
  password,
  scope
}: {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  scope: string;
}): Promise<string> => {
  const response = await request(app)
    .post('/api/v1/oauth2/authorize')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
      scope
    });

  return response.body.access_token;
};

export { fetchOAuthToken };
