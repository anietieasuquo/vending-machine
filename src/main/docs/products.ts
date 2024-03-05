import {
  allSecurity,
  Amount,
  buyerSecurity,
  CompositeAmount,
  GenericResponse,
  getErrorBodyByStatus,
  ProductDto,
  PurchaseDto,
  sellerSecurity
} from '@main/docs/common';

const tag = 'Products';

const ProductRequest = {
  type: 'object',
  properties: {
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
    }
  }
};

const PurchaseRequest = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    quantity: {
      type: 'number',
      example: 20
    }
  }
};

const PurchaseResponse = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    userId: {
      type: 'string',
      example: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f'
    },
    totalSpent: Amount,
    change: CompositeAmount,
    product: ProductDto,
    dateCreated: {
      type: 'number',
      example: 378488948844
    }
  }
};

const createProduct = {
  tags: [tag],
  description: 'Create a product',
  operationId: 'createProduct',
  security: sellerSecurity,
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ProductRequest'
        }
      }
    },
    required: true
  },
  responses: {
    '201': {
      description: 'Product created successfully!',
      content: {
        'application/json': {
          schema: ProductDto
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '404': getErrorBodyByStatus(404),
    '500': getErrorBodyByStatus(500)
  }
};

const getProducts = {
  tags: [tag],
  description: 'Get all products',
  operationId: 'getProducts',
  security: allSecurity,
  responses: {
    '200': {
      description: 'Products retrieved successfully',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: ProductDto
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

const getProductById = {
  tags: [tag],
  description: 'Get product by ID',
  operationId: 'getProductById',
  security: allSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'Product ID',
      required: true,
      type: 'string'
    }
  ],
  responses: {
    '200': {
      description: 'Product retrieved successfully',
      content: {
        'application/json': {
          schema: ProductDto
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

const updateProduct = {
  tags: [tag],
  description: 'Update product by ID',
  operationId: 'updateProduct',
  security: sellerSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'Product ID',
      required: true,
      type: 'string'
    }
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ProductRequest'
        }
      }
    },
    required: true
  },
  responses: {
    '200': {
      description: 'Product updated successfully',
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

const makePurchase = {
  tags: [tag],
  description: 'Make a purchase',
  operationId: 'makePurchase',
  security: buyerSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'Product ID',
      required: true,
      type: 'string'
    }
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/PurchaseRequest'
        }
      }
    },
    required: true
  },
  responses: {
    '201': {
      description: 'Purchase successful',
      content: {
        'application/json': {
          schema: PurchaseResponse
        }
      }
    },
    '400': getErrorBodyByStatus(400),
    '401': getErrorBodyByStatus(401),
    '402': getErrorBodyByStatus(402),
    '403': getErrorBodyByStatus(403),
    '404': getErrorBodyByStatus(404),
    '409': getErrorBodyByStatus(409),
    '500': getErrorBodyByStatus(500)
  }
};

const getPurchasesByProductId = {
  tags: [tag],
  description: 'Get product purchases by product ID',
  operationId: 'getPurchasesByProductId',
  security: sellerSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'Product ID',
      required: true,
      type: 'string'
    }
  ],
  responses: {
    '200': {
      description: 'Purchases retrieved successfully',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: PurchaseDto
          }
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

const deleteProduct = {
  tags: [tag],
  description: 'Delete a product',
  operationId: 'deleteProduct',
  security: sellerSecurity,
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'Product ID',
      required: true,
      type: 'string'
    }
  ],
  responses: {
    '200': {
      description: 'Product deleted successfully',
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

const productPaths = {
  '/api/v1/products': {
    post: createProduct,
    get: getProducts
  },
  '/api/v1/products/{id}': {
    delete: deleteProduct,
    get: getProductById,
    put: updateProduct
  },
  '/api/v1/products/{id}/buy': {
    post: makePurchase
  },
  '/api/v1/products/{id}/purchases': {
    get: getPurchasesByProductId
  }
};

export {
  ProductRequest,
  PurchaseRequest,
  PurchaseResponse,
  tag as productTag,
  productPaths
};
