import { commonUtils, CrudRepository, logger } from 'tspa';
import { Product } from '@main/types/store';
import { NotFoundException } from '@main/exception/NotFoundException';
import { ProductDto, ProductRequest } from '@main/types/dto';
import { UserService } from '@main/services/UserService';
import { fromProductToProductDto } from '@main/util/mapper';

class ProductService {
  public constructor(
    private readonly productRepository: CrudRepository<Product>,
    private readonly userService: UserService
  ) {}

  public async createProduct(request: ProductRequest): Promise<ProductDto> {
    await this.checkProduct(request);

    const { productName, productDescription, cost, amountAvailable, sellerId } =
      request;

    const existingProduct = await this.findBy({
      productName: productName!
    });

    if (existingProduct) {
      logger.error('Product already exists');
      throw new Error('Product already exists');
    }

    logger.debug('Product does not exist');

    const product: Product = {
      productName,
      productDescription,
      cost,
      amountAvailable,
      sellerId
    };
    const newProduct: Product | undefined = await this.productRepository.create(
      <Product>product
    );

    if (!newProduct) {
      logger.error('Failed to create product');
      throw new Error('Failed to create product');
    }

    return fromProductToProductDto(newProduct);
  }

  public async findProductById(id: string): Promise<ProductDto | undefined> {
    const product = await this.productRepository.findById(id);
    if (!product) return undefined;
    return fromProductToProductDto(product);
  }

  public async findAllProducts(): Promise<ProductDto[]> {
    const products = await this.productRepository.findAll();
    return products.map((product) => fromProductToProductDto(product));
  }

  public async findBy(
    filter: Partial<Product>
  ): Promise<ProductDto | undefined> {
    const product = await this.productRepository.findOneBy(filter);
    if (!product) return undefined;
    return fromProductToProductDto(product);
  }

  public async updateProduct(
    id: string,
    request: Partial<ProductRequest>
  ): Promise<boolean> {
    await this.checkProduct(request);

    const { productName, productDescription, cost, amountAvailable, sellerId } =
      request;

    if (!productName || !cost || !amountAvailable || !sellerId) {
      throw new Error('Invalid product data');
    }

    const product: Product | undefined =
      await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found');

    const updatedProduct: Partial<Product> = {
      ...product,
      productName,
      productDescription,
      cost,
      amountAvailable,
      sellerId
    };
    return await this.productRepository.update(id, <Product>updatedProduct);
  }

  public async deleteProduct(id: string): Promise<boolean> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return await this.productRepository.remove(id);
  }

  private async checkProduct(request: Partial<ProductRequest>): Promise<void> {
    const { productName, cost, amountAvailable, sellerId } = request;

    if (commonUtils.isAnyEmpty(productName, amountAvailable, sellerId)) {
      throw new Error('Invalid product data');
    }

    if (cost && (cost.value < 0 || cost.value % 5 !== 0)) {
      throw new Error('Invalid cost. Only multiples of 5 are allowed');
    }

    const user = await this.userService.findUserById(sellerId!);
    if (!user) throw new NotFoundException('Seller not found');
  }
}

export { ProductService };
