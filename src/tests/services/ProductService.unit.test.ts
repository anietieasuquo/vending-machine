import { jest } from '@jest/globals';
import { BadRequestException } from '../../main/exception/BadRequestException';
import { ProductService } from '../../main/services/ProductService';
import { UserService } from '../../main/services/UserService';
import { Product, User } from '../../main/types/store';
import { ProductRequest } from '../../main/types/dto';
import { Optional, TransactionalCrudRepository } from 'tspa';
import { NotFoundException } from '../../main/exception/NotFoundException';
import { DuplicateEntryException } from '../../main/exception/DuplicateEntryException';

describe('ProductService Unit Tests', () => {
  let productRepository: jest.Mocked<TransactionalCrudRepository<Product>>;
  let userService: jest.Mocked<UserService>;
  let productService: ProductService;
  const sellerAccount: User = {
    username: 'seller-0',
    password: 'password',
    deposit: {
      currency: 'EUR',
      unit: 'cent',
      value: 10
    },
    roleId: '1',
    machineId: '2'
  };
  const product: Product = {
    id: '7780aa0a-c39a-4f9c-c09d-bcb571fb800f',
    sellerId: '9e7f67cd-b629-4c6e-90fd-8491e9d297c9',
    productName: 'iPhone 12',
    productDescription: 'iPhone 12',
    amountAvailable: 10,
    cost: {
      currency: 'EUR',
      unit: 'cent',
      value: 100
    },
    dateCreated: 1623831600000,
    version: 1
  };

  beforeAll(() => {
    productRepository = {
      create: jest.fn(),
      createAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findOneBy: jest.fn()
    } as unknown as jest.Mocked<TransactionalCrudRepository<Product>>;
    userService = {
      findUserById: jest.fn()
    } as unknown as jest.Mocked<UserService>;
    productService = new ProductService(productRepository, userService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an exception when creating a product with an invalid product name', async () => {
    //GIVEN
    const productRequest: ProductRequest = {
      productName: '',
      productDescription: 'test',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 100
      },
      sellerId: 'test'
    };

    //THEN
    await expect(async () => {
      await productService.createProduct(productRequest);
    }).rejects.toThrow(BadRequestException);
  });

  it('should throw an exception when creating a product with an unknown seller', async () => {
    //GIVEN
    const productRequest: ProductRequest = {
      productName: 'test',
      productDescription: 'test',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 100
      },
      sellerId: 'test'
    };

    //WHEN
    userService.findUserById.mockReturnValue(Promise.resolve(Optional.empty()));

    //THEN
    await expect(async () => {
      await productService.createProduct(productRequest);
    }).rejects.toThrow(NotFoundException);
  });

  it('should throw an exception when creating a product with an unsafe entry in the name', async () => {
    //GIVEN
    const productRequest: ProductRequest = {
      productName: 'test$size',
      productDescription: 'test',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 100
      },
      sellerId: 'test'
    };

    //WHEN
    userService.findUserById.mockReturnValue(
      Promise.resolve(Optional.of(sellerAccount))
    );

    //THEN
    await expect(async () => {
      await productService.createProduct(productRequest);
    }).rejects.toThrow(BadRequestException);
  });

  it('should throw an exception when creating a product with a duplicate name', async () => {
    //GIVEN
    const productRequest: ProductRequest = {
      productName: 'test',
      productDescription: 'test',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 100
      },
      sellerId: 'test'
    };

    //WHEN
    userService.findUserById.mockReturnValue(
      Promise.resolve(Optional.of(sellerAccount))
    );
    productRepository.findOneBy.mockReturnValue(
      Promise.resolve(Optional.of(product))
    );

    //THEN
    await expect(async () => {
      await productService.createProduct(productRequest);
    }).rejects.toThrow(DuplicateEntryException);
  });

  it('should create and save product', async () => {
    //GIVEN
    const productRequest: ProductRequest = {
      productName: 'test',
      productDescription: 'test',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 100
      },
      sellerId: 'test'
    };

    //WHEN
    userService.findUserById.mockReturnValue(
      Promise.resolve(Optional.of(sellerAccount))
    );
    productRepository.findOneBy.mockReturnValue(
      Promise.resolve(Optional.empty())
    );
    productRepository.create.mockReturnValue(
      Promise.resolve({ ...product, id: '1001' })
    );

    const result = await productService.createProduct(productRequest);

    //THEN
    expect(result).toBeTruthy();
    expect(result.id).toBe('1001');
  });

  it('should find product by id', async () => {
    //GIVEN
    const id = '1001';

    //WHEN
    productRepository.findById.mockReturnValue(
      Promise.resolve(Optional.of({ ...product, id }))
    );

    const result = await productService.findProductById(id);

    //THEN
    expect(result).toBeTruthy();
    expect(result.isPresent()).toBe(true);
    const found = result.get();
    expect(found.id).toBe('1001');
  });

  it('should find all products', async () => {
    //GIVEN
    const id = '1001';

    //WHEN
    productRepository.findAll.mockReturnValue(
      Promise.resolve([
        { ...product, id },
        { ...product, id: '1002' }
      ])
    );

    const result = await productService.findAllProducts();

    //THEN
    expect(result).toBeTruthy();
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id).sort()).toEqual(['1001', '1002'].sort());
  });

  it('should find product by name', async () => {
    //GIVEN
    const productName = 'iPhone 12';

    //WHEN
    productRepository.findOneBy.mockReturnValue(
      Promise.resolve(Optional.of({ ...product, productName, id: '1001' }))
    );

    const result = await productService.findOneBy({ productName });

    //THEN
    expect(result).toBeTruthy();
    expect(result.isPresent()).toBe(true);
    const found = result.get();
    expect(found.id).toBe('1001');
    expect(found.productName).toBe(productName);
  });

  it('should throw an exception when updating a product with an invalid name', async () => {
    //GIVEN
    const productId = '1001';
    const productRequest: ProductRequest = {
      productName: '',
      productDescription: 'test',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 5
      },
      sellerId: 'seller-0'
    };

    //THEN
    await expect(async () => {
      await productService.updateProduct(productId, productRequest);
    }).rejects.toThrow(BadRequestException);
  });

  it('should throw an exception when updating a product with a seller id', async () => {
    //GIVEN
    const productId = '1001';
    const productRequest: ProductRequest = {
      productName: 'test',
      productDescription: 'test',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 100
      },
      sellerId: 'seller-0'
    };

    //THEN
    await expect(async () => {
      await productService.updateProduct(productId, productRequest);
    }).rejects.toThrow(BadRequestException);
  });

  it('should throw an exception when updating a product with an invalid cost', async () => {
    //GIVEN
    const productId = '1001';
    const productRequest: ProductRequest = {
      productName: 'test',
      productDescription: 'test',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 7
      },
      sellerId: 'seller-0'
    };

    //THEN
    await expect(async () => {
      await productService.updateProduct(productId, productRequest);
    }).rejects.toThrow(BadRequestException);
  });

  it('should throw an exception when updating a product with an unsafe value', async () => {
    //GIVEN
    const productId = '1001';
    const productRequest: ProductRequest = {
      productName: 'test$size',
      productDescription: 'test',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 5
      },
      sellerId: 'seller-0'
    };

    //THEN
    await expect(async () => {
      await productService.updateProduct(productId, productRequest);
    }).rejects.toThrow(BadRequestException);
  });

  it('should update a product', async () => {
    //GIVEN
    const productId = '1001';
    const productRequest: ProductRequest = {
      productName: 'test',
      productDescription: 'test',
      amountAvailable: 10,
      cost: {
        currency: 'EUR',
        unit: 'cent',
        value: 5
      },
      sellerId: ''
    };

    //WHEN
    productRepository.findById.mockReturnValue(
      Promise.resolve(Optional.of({ ...product, id: productId }))
    );
    productRepository.update.mockReturnValue(Promise.resolve(true));

    const result = await productService.updateProduct(
      productId,
      productRequest
    );

    //THEN
    expect(result).toBeTruthy();
  });

  it('should throw an exception when delete a product that does not exist', async () => {
    //GIVEN
    const productId = '1001';

    //WHEN
    productRepository.findById.mockReturnValue(
      Promise.resolve(Optional.empty())
    );

    //THEN
    await expect(async () => {
      await productService.deleteProduct(productId);
    }).rejects.toThrow(NotFoundException);
  });

  it('should delete a product', async () => {
    //GIVEN
    const productId = '1001';

    //WHEN
    productRepository.findById.mockReturnValue(
      Promise.resolve(Optional.of({ ...product, id: productId }))
    );
    productRepository.remove.mockReturnValue(Promise.resolve(true));

    const result = await productService.deleteProduct(productId);

    //THEN
    expect(result).toBeTruthy();
  });
});
