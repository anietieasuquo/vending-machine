import { errorMap } from '@main/exception/errorMap';

const GenericResponse = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      example: true
    },
    data: {
      type: 'string',
      example: 'Successful'
    }
  }
};

const Amount = {
  type: 'object',
  properties: {
    value: {
      type: 'number',
      example: 1000
    },
    currency: {
      type: 'string',
      example: 'EUR'
    },
    unit: {
      type: 'string',
      example: 'cent'
    }
  }
};

const CompositeAmount = {
  type: 'object',
  properties: {
    value: {
      type: 'array',
      items: {
        type: 'number',
        example: 50
      }
    },
    currency: {
      type: 'string',
      example: 'EUR'
    },
    unit: {
      type: 'string',
      example: 'cent'
    }
  }
};

const ProductDto = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    productName: {
      type: 'string',
      example: 'Coca Cola'
    },
    productDescription: {
      type: 'string',
      example: 'A refreshing drink'
    },
    amountAvailable: {
      type: 'number',
      example: 20
    },
    cost: Amount,
    sellerId: {
      type: 'string',
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

const PurchaseDto = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    productId: {
      type: 'string',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    userId: {
      type: 'string',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    amount: Amount,
    status: {
      type: 'string',
      example: 'COMPLETED'
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

const RoleDto = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    name: {
      type: 'string',
      example: 'Buyer'
    },
    privileges: {
      type: 'array',
      items: {
        type: 'string',
        example: 'PURCHASE'
      }
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

const buyerSecurity = [
  {
    oauth2: ['buyer']
  }
];

const sellerSecurity = [
  {
    oauth2: ['seller']
  }
];

const adminSecurity = [
  {
    oauth2: ['admin']
  }
];

const allSecurity = [
  {
    oauth2: ['buyer', 'seller', 'admin']
  }
];

const createErrorBody = (name: keyof typeof errorMap, status: number) => {
  return {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: name
      },
      code: {
        type: 'number',
        example: status
      },
      timestamp: {
        type: 'string',
        example: '2024-01-01T12:00:00.000Z'
      },
      path: {
        type: 'string',
        example: '/api/v1/users/71675fcb655047cdc4955929'
      }
    }
  };
};

const getErrorNameByStatus = (status: number): string => {
  return (
    Object.keys(errorMap).find((key) => errorMap[key] === status) || 'Error'
  );
};

const createErrorResponse = (name: keyof typeof errorMap) => {
  if (!(name in errorMap)) return createErrorBody('BadRequestException', 400);
  return {
    description: name,
    content: {
      'application/json': {
        schema: createErrorBody(name.toString(), errorMap[name])
      }
    }
  };
};

const getErrorBodyByStatus = (status: number) => {
  const name = getErrorNameByStatus(status);
  return createErrorResponse(name);
};

export {
  getErrorBodyByStatus,
  createErrorBody,
  GenericResponse,
  Amount,
  CompositeAmount,
  ProductDto,
  PurchaseDto,
  RoleDto,
  buyerSecurity,
  sellerSecurity,
  adminSecurity,
  allSecurity
};
