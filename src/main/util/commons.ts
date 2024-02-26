import * as crypto from 'crypto';
import { commonUtils } from 'tspa';

const sha256 = (data: string): string => {
  return crypto.createHash('sha256').update(data!).digest('hex');
};

const generateSha256 = (): string => {
  return crypto.randomBytes(256).toString('hex');
};

const makeChange = (coins: number[], amount: number): number[] => {
  const list: number[] = new Array(amount + 1).fill(Infinity);
  const coinUsed: number[][] = new Array(amount + 1).fill([]);

  list[0] = 0;

  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      // @ts-ignore
      if (list[i - coin] + 1 < list[i]) {
        // @ts-ignore
        list[i] = list[i - coin] + 1;
        // @ts-ignore
        coinUsed[i] = [...coinUsed[i - coin], coin];
      }
    }
  }

  if (list[amount] === Infinity) {
    throw new Error('Cannot make change with the given coins');
  }

  // @ts-ignore
  return coinUsed[amount];
};

const getScope = (scope?: string | string[] | undefined): string[] => {
  if (!scope || commonUtils.isEmpty(scope)) return [];
  if (Array.isArray(scope)) return scope;
  return scope.split(' ');
};

export { sha256, generateSha256, makeChange, getScope };
