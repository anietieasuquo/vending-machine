import { commonUtils, CrudRepository, logger } from 'tspa';
import { Amount, Purchase, PurchaseStatus } from '@main/types/store';
import { NotFoundException } from '@main/exception/NotFoundException';
import { PurchaseRequest, CreatePurchaseResponse } from '@main/types/dto';
import { ProductService } from '@main/services/ProductService';
import { UserService } from '@main/services/UserService';
import { PurchaseException } from '@main/exception/PurchaseException';
import { makeChange } from '@main/util/commons';
import { OutOfStockException } from '@main/exception/OutOfStockException';
import { InsufficientFundsException } from '@main/exception/InsufficientFundsException';

class PurchaseService {
  public static readonly SUPPORTED_DENOMINATIONS: number[] = [
    5, 10, 20, 50, 100
  ];

  public constructor(
    private readonly purchaseRepository: CrudRepository<Purchase>,
    private readonly userService: UserService,
    private readonly productService: ProductService
  ) {}

  public async createPurchase(
    purchase: PurchaseRequest
  ): Promise<CreatePurchaseResponse> {
    const { userId, productId, quantity } = purchase;
    if (commonUtils.isAnyEmpty(userId, productId)) {
      throw new Error('Invalid purchase data');
    }

    if (quantity < 1) {
      throw new Error('Invalid quantity. Must be greater than 0');
    }

    const user = await this.userService.findUserById(userId);
    if (!user) throw new NotFoundException('User not found');

    const product = await this.productService.findProductById(productId);
    if (!product) throw new NotFoundException('Product not found');

    if (product.amountAvailable < quantity) {
      throw new OutOfStockException('Out of stock');
    }

    const totalSpent = product.cost.value * quantity;
    if (user.deposit.value < totalSpent) {
      throw new InsufficientFundsException('Insufficient funds');
    }

    const purchasePayload: Purchase = {
      productId,
      userId,
      amount: {
        value: totalSpent,
        currency: product.cost.currency,
        unit: product.cost.unit
      },
      status: PurchaseStatus.PENDING
    };

    const purchaseRecord =
      await this.purchaseRepository.create(purchasePayload);

    if (!purchaseRecord) {
      throw new PurchaseException('Failed to complete purchase');
    }

    const productAvailable: number = product.amountAvailable - quantity;
    const change: number = user.deposit.value - totalSpent;
    let changeList: number[] = [];
    let userChange: number = change;

    try {
      changeList = makeChange(PurchaseService.SUPPORTED_DENOMINATIONS, change);
      userChange = 0;
    } catch (error) {
      logger.error('Failed to make change. User keeps change.', error);
    }

    const userDeposit: Amount = {
      value: userChange,
      currency: user.deposit.currency,
      unit: user.deposit.unit
    };

    await this.userService.updateUser(userId, { deposit: userDeposit });
    const productUpdate = await this.productService.updateProduct(productId, {
      amountAvailable: productAvailable
    });

    if (!productUpdate) {
      throw new PurchaseException('Failed to complete purchase');
    }

    const finalizePurchase: boolean = await this.purchaseRepository.update(
      purchaseRecord.id!,
      { status: PurchaseStatus.COMPLETED }
    );

    if (!finalizePurchase) {
      throw new PurchaseException('Failed to finalize purchase');
    }

    const response: CreatePurchaseResponse = {
      totalSpent: purchasePayload.amount,
      change: {
        value: changeList,
        currency: user.deposit.currency,
        unit: user.deposit.unit
      },
      product: {
        ...product,
        amountAvailable: productAvailable
      }
    };
    logger.debug('Purchase completed', response);
    return response;
  }
}

export { PurchaseService };
