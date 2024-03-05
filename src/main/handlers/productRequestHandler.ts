import { Request, Response } from 'express';
import { ProductHandler } from '@main/types/web';
import { NotFoundException } from '@main/exception/NotFoundException';
import {
  GenericResponse,
  ProductDto,
  ProductRequest,
  PurchaseDto,
  PurchaseRequest,
  PurchaseResponse
} from '@main/types/dto';
import { logger, Objects } from 'tspa';
import { ProductService } from '@main/services/ProductService';
import { executeRequest } from '@main/handlers/requestHandler';
import { BadRequestException } from '@main/exception/BadRequestException';
import { Product } from '@main/types/store';
import {
  fromProductToProductDto,
  fromPurchaseToPurchaseDto
} from '@main/util/mapper';
import { PurchaseService } from '@main/services/PurchaseService';

let productService: ProductService;
let purchaseService: PurchaseService;

const createProduct = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<ProductDto>(
    async () => {
      logger.info('Creating product:', request.body);
      const { productName, amountAvailable, sellerId, cost }: ProductRequest =
        request.body;
      Objects.requireNonEmpty(
        [productName, amountAvailable, sellerId, cost],
        new BadRequestException('Invalid product data')
      );

      const product: Product = await productService.createProduct(
        request.body as ProductRequest
      );

      logger.info('Product created:', product);

      return fromProductToProductDto(product);
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
      Objects.requireNonEmpty(
        id,
        new BadRequestException('Invalid product id')
      );

      const product: Product = (
        await productService.findProductById(id)
      ).orElseThrow(new NotFoundException('Product not found'));
      return fromProductToProductDto(product);
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
      return (await productService.findAllProducts()).map(
        fromProductToProductDto
      );
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
      Objects.requireNonEmpty(
        [id, productRequest],
        new BadRequestException('Invalid product data')
      );

      const update = await productService.updateProduct(id, productRequest);
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

const makePurchase = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<PurchaseResponse>(
    async () => {
      const { id } = request.params;
      logger.info('Creating purchase:', { body: request.body, id });
      const { userId, quantity }: PurchaseRequest = request.body;
      Objects.requireNonEmpty(
        [id, userId, quantity],
        new BadRequestException('Invalid purchase data')
      );

      const purchaseResponse: PurchaseResponse =
        await purchaseService.createPurchase(
          id,
          request.body as PurchaseRequest
        );

      logger.info('Purchase created:', purchaseResponse);

      return purchaseResponse;
    },
    201,
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
      Objects.requireNonEmpty(
        id,
        new BadRequestException('Invalid product ID')
      );

      const deleted = await productService.deleteProduct(id);
      const data = deleted ? 'Deleted' : 'Failed';

      return {
        success: deleted,
        data
      };
    },
    200,
    response,
    request
  );
};

const fetchPurchasesByProductId = async (
  request: Request,
  response: Response
): Promise<void> => {
  await executeRequest<PurchaseDto[]>(
    async () => {
      const { id } = request.params;
      Objects.requireNonEmpty(
        id,
        new BadRequestException('Invalid product ID')
      );

      return (await purchaseService.getPurchases({ productId: id })).map(
        fromPurchaseToPurchaseDto
      );
    },
    200,
    response,
    request
  );
};

export default (
  injectedProductService: ProductService,
  injectedPurchaseService: PurchaseService
): ProductHandler => {
  productService = injectedProductService;
  purchaseService = injectedPurchaseService;

  return {
    createProduct,
    fetchProductById,
    fetchAllProducts,
    updateProduct,
    makePurchase,
    fetchPurchasesByProductId,
    deleteProduct
  };
};
