import {
  commonUtils,
  logger,
  MongoSession,
  Objects,
  TransactionalCrudRepository
} from 'tspa';
import { Amount, Purchase, PurchaseStatus } from '@main/types/store';
import { NotFoundException } from '@main/exception/NotFoundException';
import {
  PurchaseFilter,
  PurchaseRequest,
  PurchaseResponse
} from '@main/types/dto';
import { ProductService } from '@main/services/ProductService';
import { UserService } from '@main/services/UserService';
import { InternalServerException } from '@main/exception/InternalServerException';
import { makeChange } from '@main/util/commons';
import { OutOfStockException } from '@main/exception/OutOfStockException';
import { InsufficientFundsException } from '@main/exception/InsufficientFundsException';
import { BadRequestException } from '@main/exception/BadRequestException';
import { fromProductToProductDto } from '@main/util/mapper';

class PurchaseService {
  public static readonly SUPPORTED_DENOMINATIONS: number[] = [
    5, 10, 20, 50, 100
  ];

  public constructor(
    private readonly purchaseRepository: TransactionalCrudRepository<Purchase>,
    private readonly userService: UserService,
    private readonly productService: ProductService
  ) {}

  public async createPurchase(
    productId: string,
    purchase: PurchaseRequest
  ): Promise<PurchaseResponse> {
    logger.debug('Purchase > Creating purchase:', { productId, purchase });
    const { userId, quantity } = purchase;
    Objects.requireNonEmpty(
      [userId, productId],
      new BadRequestException('Invalid purchase data')
    );

    Objects.requireTrue(
      quantity > 0,
      new BadRequestException('Invalid quantity. Must be greater than 0')
    );

    const [userResult, productResult] = await Promise.all([
      this.userService.findUserById(userId),
      this.productService.findProductById(productId)
    ]);
    userResult.orElseThrow(new NotFoundException('User not found'));
    productResult.orElseThrow(new NotFoundException('Product not found'));

    const user = userResult.get();
    const product = productResult.get();

    Objects.requireTrue(
      product.amountAvailable >= quantity,
      new OutOfStockException('Out of stock')
    );

    const totalSpent = product.cost.value * quantity;
    Objects.requireTrue(
      user.deposit.value >= totalSpent,
      new InsufficientFundsException('Insufficient funds')
    );

    const purchasePayload: Purchase = {
      productId,
      buyerId: userId,
      sellerId: product.sellerId,
      amount: {
        value: totalSpent,
        currency: product.cost.currency,
        unit: product.cost.unit
      },
      status: PurchaseStatus.PENDING
    };

    Objects.requireTrue(
      commonUtils.isSafe(purchasePayload),
      new BadRequestException('Invalid purchase data')
    );

    return this.purchaseRepository.executeTransaction({
      mongoExecutor: async (
        session: MongoSession
      ): Promise<PurchaseResponse> => {
        Objects.requireTrue(
          commonUtils.isSafe(purchasePayload),
          new BadRequestException('Invalid purchase data')
        );

        const purchaseRecord: Purchase = await this.purchaseRepository.create(
          purchasePayload,
          { mongoOptions: { session } }
        );

        logger.info('Purchase > Purchase created:', purchaseRecord);
        const productAvailable: number = product.amountAvailable - quantity;
        const change: number = user.deposit.value - totalSpent;
        let changeList: number[] = [];
        let userChange: number = change;

        try {
          changeList = makeChange(
            PurchaseService.SUPPORTED_DENOMINATIONS,
            change
          );
          userChange = 0;
        } catch (error) {
          logger.error(
            'Purchase > Failed to make change. User keeps change.',
            error
          );
        }

        const userDeposit: Amount = {
          value: userChange,
          currency: user.deposit.currency,
          unit: user.deposit.unit
        };

        const userUpdate = await this.userService.updateUser(
          userId,
          { deposit: userDeposit },
          session
        );

        Objects.requireTrue(
          userUpdate,
          new InternalServerException('Failed to complete purchase')
        );

        logger.info('Purchase > User deposit updated:', userDeposit);

        const productUpdate = await this.productService.updateProduct(
          productId,
          { amountAvailable: productAvailable },
          session
        );

        Objects.requireTrue(
          productUpdate,
          new InternalServerException('Failed to complete purchase')
        );

        logger.info('Purchase > Product amount updated:', productAvailable);

        const finalizePurchase: boolean = await this.purchaseRepository.update(
          purchaseRecord.id!,
          {
            status: PurchaseStatus.COMPLETED,
            version: purchaseRecord.version
          },
          { locking: 'optimistic', mongoOptions: { session } }
        );

        Objects.requireTrue(
          finalizePurchase,
          new InternalServerException('Failed to finalize purchase')
        );

        logger.info('Purchase > Purchase finalized:', purchaseRecord.id);

        const response: PurchaseResponse = {
          id: purchaseRecord.id!,
          buyerId: purchaseRecord.buyerId,
          totalSpent: purchasePayload.amount,
          change: {
            value: changeList,
            currency: user.deposit.currency,
            unit: user.deposit.unit
          },
          product: {
            ...fromProductToProductDto(product),
            amountAvailable: productAvailable
          },
          dateCreated: purchaseRecord.dateCreated!
        };

        logger.info('Purchase completed successfully', response);
        return response;
      }
    });
  }

  public async getPurchases(
    filter?: PurchaseFilter | undefined
  ): Promise<Purchase[]> {
    return this.purchaseRepository.findAll(filter);
  }
}

export { PurchaseService };
