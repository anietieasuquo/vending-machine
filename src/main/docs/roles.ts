import {
  adminSecurity,
  getErrorBodyByStatus,
  RoleDto
} from '@main/docs/common';

const tag = 'Roles';

const getRoles = {
  tags: [tag],
  description: 'Get all roles',
  operationId: 'getRoles',
  security: adminSecurity,
  responses: {
    '200': {
      description: 'Roles retrieved successfully',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: RoleDto
          }
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '401': getErrorBodyByStatus(401),
    '403': getErrorBodyByStatus(403),
    '500': getErrorBodyByStatus(500)
  }
};

const rolePaths = {
  '/api/v1/roles': {
    get: getRoles
  }
};

export { tag as roleTag, rolePaths };
