import {
  adminSecurity,
  getErrorBodyByStatus,
  PurchaseDto
} from '@main/docs/common';

const tag = 'Purchases';

const getPurchases = {
  tags: [tag],
  description: 'Get all purchases',
  operationId: 'getPurchases',
  security: adminSecurity,
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
    '500': getErrorBodyByStatus(500)
  }
};

const purchasePaths = {
  '/api/v1/purchases': {
    get: getPurchases
  }
};

export { tag as purchaseTag, purchasePaths };
