import { ConnectionBasedRepository, logger } from 'tspa';
import { User } from '@main/types/store';
import { ModuleFactory } from '@main/factories/ModuleFactory';

class DatabaseService {
  public static async connect(): Promise<boolean> {
    let retries = 0;
    let isMongoDBConnected = await this.isConnected();
    if (isMongoDBConnected) {
      return true;
    }

    while (!isMongoDBConnected) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const isConnected = await this.isConnected();

      if (isConnected) {
        isMongoDBConnected = true;
        return true;
      }
      logger.info('DatabaseService > Waiting for MongoDB connection:', {
        retries: ++retries,
        isMongoDBConnected
      });
    }
    return false;
  }

  private static async isConnected(): Promise<boolean> {
    const connected = (<ConnectionBasedRepository<User>>(
      (<unknown>ModuleFactory.getUserRepository)
    )).isConnected();
    if (!connected) {
      await ModuleFactory.getUserRepository.findById('proto');
    }
    return connected;
  }
}

export { DatabaseService };
