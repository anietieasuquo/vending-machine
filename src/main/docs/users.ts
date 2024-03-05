import {
  adminSecurity,
  allSecurity,
  Amount,
  buyerSecurity,
  GenericResponse,
  getErrorBodyByStatus
} from '@main/docs/common';

const tag = 'Users';
const UserRequest = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      example: 'tommy'
    },
    password: {
      type: 'string',
      example: 'password!2024%'
    },
    deposit: Amount,
    role: {
      type: 'string',
      example: 'Buyer'
    },
    machine: {
      type: 'string',
      example: 'Default'
    }
  }
};

const RoleRequest = {
  type: 'object',
  properties: {
    role: {
      type: 'string',
      example: 'Buyer'
    }
  }
};

const PasswordRequest = {
  type: 'object',
  properties: {
    password: {
      type: 'string',
      example: 'password!2024%'
    }
  }
};

const DepositRequest = {
  type: 'object',
  properties: {
    amount: Amount
  }
};

const UserDto = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    username: {
      type: 'string',
      example: 'tommy'
    },
    deposit: Amount,
    roleId: {
      type: 'string',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    machineId: {
      type: 'string',
      description: 'The ID of the vending machine the user is using.',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    dateCreated: {
      type: 'number',
      example: 378488948844
    },
    dateUpdated: {
      type: 'number',
      example: 378488948844
    }
  }
};

const createUser = {
  tags: [tag],
  description: 'Create a new user',
  operationId: 'createUser',
  security: [],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/UserRequest'
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
          schema: UserDto
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '404': getErrorBodyByStatus(404),
    '500': getErrorBodyByStatus(500)
  }
};

const createAdmin = {
  tags: [tag],
  description: 'Create a new admin user',
  operationId: 'createAdmin',
  security: adminSecurity,
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/UserRequest'
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
          schema: UserDto
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '401': getErrorBodyByStatus(401),
    '403': getErrorBodyByStatus(403),
    '500': getErrorBodyByStatus(500)
  }
};

const getUsers = {
  tags: [tag],
  description: 'Get all users',
  operationId: 'getUsers',
  security: adminSecurity,
  responses: {
    '200': {
      description: 'Users retrieved successfully',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: UserDto
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

const getUserById = {
  tags: [tag],
  description: 'Get user by ID',
  operationId: 'getUserById',
  security: allSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'User ID',
      required: true,
      type: 'string'
    }
  ],
  responses: {
    '200': {
      description: 'User retrieved successfully',
      content: {
        'application/json': {
          schema: UserDto
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '401': getErrorBodyByStatus(401),
    '403': getErrorBodyByStatus(403),
    '404': getErrorBodyByStatus(404),
    '500': getErrorBodyByStatus(500)
  }
};

const makeDeposit = {
  tags: [tag],
  description: 'Make a deposit',
  operationId: 'makeDeposit',
  security: buyerSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'User ID',
      required: true,
      type: 'string'
    }
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/DepositRequest'
        }
      }
    },
    required: true
  },
  responses: {
    '201': {
      description: 'Deposit successful',
      content: {
        'application/json': {
          schema: Amount
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '401': getErrorBodyByStatus(401),
    '403': getErrorBodyByStatus(403),
    '404': getErrorBodyByStatus(404),
    '500': getErrorBodyByStatus(500)
  }
};

const resetDeposit = {
  tags: [tag],
  description: 'Reset deposit for a user',
  operationId: 'resetDeposit',
  security: buyerSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'User ID',
      required: true,
      type: 'string'
    }
  ],
  responses: {
    '200': {
      description: 'Reset successful',
      content: {
        'application/json': {
          schema: Amount
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '401': getErrorBodyByStatus(401),
    '403': getErrorBodyByStatus(403),
    '404': getErrorBodyByStatus(404),
    '500': getErrorBodyByStatus(500)
  }
};

const updateRole = {
  tags: [tag],
  description: 'Update role for a user',
  operationId: 'updateRole',
  security: adminSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'User ID',
      required: true,
      type: 'string'
    }
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/RoleRequest'
        }
      }
    },
    required: true
  },
  responses: {
    '200': {
      description: 'Role updated successfully',
      content: {
        'application/json': {
          schema: GenericResponse
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '401': getErrorBodyByStatus(401),
    '403': getErrorBodyByStatus(403),
    '404': getErrorBodyByStatus(404),
    '500': getErrorBodyByStatus(500)
  }
};

const changePassword = {
  tags: [tag],
  description: 'Change password',
  operationId: 'changePassword',
  security: allSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'User ID',
      required: true,
      type: 'string'
    }
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/PasswordRequest'
        }
      }
    },
    required: true
  },
  responses: {
    '200': {
      description: 'Password updated successfully',
      content: {
        'application/json': {
          schema: GenericResponse
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '401': getErrorBodyByStatus(401),
    '403': getErrorBodyByStatus(403),
    '404': getErrorBodyByStatus(404),
    '500': getErrorBodyByStatus(500)
  }
};

const deleteUser = {
  tags: [tag],
  description: 'Delete a user',
  operationId: 'deleteUser',
  security: allSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'User ID',
      required: true,
      type: 'string'
    }
  ],
  responses: {
    '200': {
      description: 'User deleted successfully',
      content: {
        'application/json': {
          schema: GenericResponse
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '401': getErrorBodyByStatus(401),
    '403': getErrorBodyByStatus(403),
    '404': getErrorBodyByStatus(404),
    '500': getErrorBodyByStatus(500)
  }
};

const userPaths = {
  '/api/v1/users': {
    post: createUser,
    get: getUsers
  },
  '/api/v1/users/{id}': {
    delete: deleteUser,
    get: getUserById
  },
  '/api/v1/users/admin': {
    post: createAdmin
  },
  '/api/v1/users/{id}/deposits': {
    post: makeDeposit
  },
  '/api/v1/users/{id}/deposits/reset': {
    post: resetDeposit
  },
  '/api/v1/users/{id}/password': {
    patch: changePassword
  },
  '/api/v1/users/{id}/roles': {
    patch: updateRole
  }
};

export {
  UserRequest,
  RoleRequest,
  PasswordRequest,
  DepositRequest,
  UserDto,
  tag as userTag,
  userPaths
};
