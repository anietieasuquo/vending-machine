import { getErrorBodyByStatus } from '@main/docs/common';

const tag = 'OAuth2';
const AccessTokenRequest = {
  type: 'object',
  properties: {
    grant_type: {
      type: 'string',
      example: 'password'
    },
    username: {
      type: 'string',
      example: 'tommy'
    },
    password: {
      type: 'string',
      example: 'password!2024%'
    },
    scope: {
      type: 'string',
      example: 'seller'
    },
    client_id: {
      type: 'string',
      description: 'The client ID of the vending machine the user is using.',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    client_secret: {
      type: 'string',
      description:
        'The client secret of the vending machine the user is using.',
      example: 'ef5238f1709f4653c7d5d508b4b13b6260a...'
    }
  }
};

const AccessTokenResponse = {
  type: 'object',
  properties: {
    access_token: {
      type: 'string',
      example: 'cc3b8e02518404278de51b6836cd7c...'
    },
    refresh_token: {
      type: 'string',
      example: 'cc3b8e02518404278de51b6836cd7c...'
    },
    token_type: {
      type: 'string',
      example: 'Bearer'
    },
    expires_in: {
      type: 'number',
      example: 3599
    },
    scope: {
      type: 'string',
      example: 'seller'
    }
  }
};

const requestAccessToken = {
  tags: [tag],
  description: 'Request an access token',
  operationId: 'requestAccessToken',
  security: [],
  requestBody: {
    content: {
      'application/x-www-form-urlencoded': {
        schema: {
          $ref: '#/components/schemas/AccessTokenRequest'
        }
      }
    },
    required: true
  },
  responses: {
    '201': {
      description: 'User created successfully!',
      content: {
        'application/json': {
          schema: AccessTokenResponse
        }
      }
    },
    '401': getErrorBodyByStatus(401),
    '500': getErrorBodyByStatus(500)
  }
};

const authPaths = {
  '/api/v1/oauth2/authorize': {
    post: requestAccessToken
  }
};

export { AccessTokenRequest, AccessTokenResponse, tag as oauth2Tag, authPaths };
