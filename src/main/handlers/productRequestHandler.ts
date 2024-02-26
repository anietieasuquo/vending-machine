import { Request, Response } from 'express';
import { ProductHandler } from '@main/types/web';
import { NotFoundException } from '@main/exception/NotFoundException';
import { GenericResponse, ProductDto, ProductRequest } from '@main/types/dto';
import { commonUtils, logger } from 'tspa';
import { ProductService } from '@main/services/ProductService';
import { executeRequest } from '@main/handlers/requestHandler';

let productService: ProductService;

const createProduct = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<ProductDto>(
    async () => {
      logger.info('Creating product:', request.body);
      const { productName, amountAvailable, sellerId, cost }: ProductRequest =
        request.body;
      if (
        commonUtils.isAnyEmpty(productName, amountAvailable, sellerId, cost)
      ) {
        throw new Error('Invalid product data');
      }

      const product: ProductDto = await productService.createProduct(
        request.body as ProductRequest
      );

      logger.info('Product created:', product);

      return product;
    },
    201,
    response,
    request
  );
};

const fetchProductById = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<ProductDto>(
    async () => {
      const { id } = request.params;
      if (commonUtils.isEmpty(id)) throw new Error('Invalid product id');

      const product: ProductDto | undefined =
        await productService.findProductById(id!);
      if (!product) throw new NotFoundException('Product not found');
      return product;
    },
    200,
    response,
    request
  );
};

const fetchAllProducts = async (
  request: Request,
  response: Response
): Promise<void> => {
  logger.info('Fetching all products', request.headers.authorization);
  await executeRequest<ProductDto[]>(
    async () => {
      return productService.findAllProducts();
    },
    200,
    response,
    request
  );
};

const updateProduct = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<GenericResponse<string>>(
    async () => {
      const { id } = request.params;
      const productRequest: ProductRequest = request.body;
      if (commonUtils.isAnyEmpty(id, productRequest)) {
        throw new Error('Invalid User data');
      }

      const update = await productService.updateProduct(id!, productRequest);
      const data = update ? 'Updated' : 'Failed';

      return {
        success: update,
        data
      };
    },
    200,
    response,
    request
  );
};

const deleteProduct = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<GenericResponse<string>>(
    async () => {
      const { id } = request.params;
      if (commonUtils.isAnyEmpty(id)) {
        throw new Error('Invalid User ID');
      }

      const update = await productService.deleteProduct(id!);
      const data = update ? 'Deleted' : 'Failed';

      return {
        success: update,
        data
      };
    },
    200,
    response,
    request
  );
};

export default (injectedProductService: ProductService): ProductHandler => {
  productService = injectedProductService;

  return {
    createProduct,
    fetchProductById,
    fetchAllProducts,
    updateProduct,
    deleteProduct
  };
};
