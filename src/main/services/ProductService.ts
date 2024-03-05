import {
  commonUtils,
  logger,
  MongoSession,
  Objects,
  Optional,
  TransactionalCrudRepository
} from 'tspa';
import { Product } from '@main/types/store';
import { NotFoundException } from '@main/exception/NotFoundException';
import { ProductRequest } from '@main/types/dto';
import { UserService } from '@main/services/UserService';
import { BadRequestException } from '@main/exception/BadRequestException';
import { DuplicateEntryException } from '@main/exception/DuplicateEntryException';

class ProductService {
  public constructor(
    private readonly productRepository: TransactionalCrudRepository<Product>,
    private readonly userService: UserService
  ) {}

  public async createProduct(request: ProductRequest): Promise<Product> {
    logger.info('Creating product', request);
    await this.checkProduct(request);

    const { productName, productDescription, cost, amountAvailable, sellerId } =
      request;

    const product: Product = {
      productName: productName!,
      productDescription,
      cost: cost!,
      amountAvailable: amountAvailable!,
      sellerId: sellerId!
    };

    Objects.requireTrue(
      commonUtils.isSafe(product),
      new BadRequestException('Invalid product data')
    );

    (await this.findOneBy({ productName, sellerId })).ifPresentThrow(
      new DuplicateEntryException('Product already exists')
    );

    logger.debug('Product does not already exist, proceeding to create');

    return await this.productRepository.create(<Product>product);
  }

  public async findProductById(id: string): Promise<Optional<Product>> {
    return this.productRepository.findById(id);
  }

  public async findAllProducts(): Promise<Product[]> {
    return this.productRepository.findAll();
  }

  public async findOneBy(filter: Partial<Product>): Promise<Optional<Product>> {
    return await this.productRepository.findOneBy(filter);
  }

  public async updateProduct(
    id: string,
    request: Partial<ProductRequest>,
    session?: MongoSession
  ): Promise<boolean> {
    const { productName, productDescription, cost, amountAvailable, sellerId } =
      request;

    if (productName != undefined && commonUtils.isEmpty(productName)) {
      throw new BadRequestException('Product name cannot be empty');
    }

    if (cost != undefined && (cost.value < 0 || cost.value % 5 !== 0)) {
      throw new BadRequestException(
        'Invalid cost. Only multiples of 5 are allowed'
      );
    }

    const product: Product = await this.getExpectedProduct(id, session);

    Objects.requireTrue(
      commonUtils.isEmpty(sellerId) || sellerId === product.sellerId,
      new BadRequestException(
        'You cannot change the seller of a product. Please delete and create a new product.'
      )
    );

    const update: Partial<Product> = {
      ...product,
      productName: productName || product.productName,
      productDescription: productDescription || product.productDescription,
      cost: cost || product.cost,
      amountAvailable: amountAvailable || product.amountAvailable
    };

    Objects.requireTrue(
      commonUtils.isSafe(update),
      new BadRequestException('Invalid product data')
    );

    return await this.productRepository.update(id, update, {
      locking: 'optimistic',
      mongoOptions: { session }
    });
  }

  public async deleteProduct(id: string): Promise<boolean> {
    await this.getExpectedProduct(id);
    return await this.productRepository.remove(id);
  }

  private async checkProduct(
    request: Partial<ProductRequest>,
    session?: MongoSession
  ): Promise<void> {
    const { productName, cost, amountAvailable, sellerId } = request;

    logger.debug('Checking product data', {
      productName,
      cost,
      amountAvailable,
      sellerId
    });

    Objects.requireNonEmpty(
      [productName, amountAvailable, sellerId],
      new BadRequestException('Invalid product data')
    );

    if (!cost || cost.value < 0 || cost.value % 5 !== 0) {
      throw new BadRequestException(
        'Invalid cost. Only multiples of 5 are allowed'
      );
    }

    (await this.userService.findUserById(sellerId!, session)).orElseThrow(
      new NotFoundException('Seller not found')
    );
  }

  private async getExpectedProduct(
    id: string,
    session?: MongoSession
  ): Promise<Product> {
    return (
      await this.productRepository.findById(id, { mongoOptions: { session } })
    ).orElseThrow(new NotFoundException('Product not found'));
  }
}

export { ProductService };
