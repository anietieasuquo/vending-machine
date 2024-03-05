import {
  commonUtils,
  Objects,
  Optional,
  TransactionalCrudRepository
} from 'tspa';
import { AccessClient } from '@main/types/store';
import { sha256 } from '@main/util/commons';
import { AuthenticationException } from '@main/exception/AuthenticationException';
import { BadRequestException } from '@main/exception/BadRequestException';

class AccessClientService {
  public constructor(
    private readonly clientRepository: TransactionalCrudRepository<AccessClient>
  ) {}

  public findSecretBy = async (
    filter: Partial<AccessClient>
  ): Promise<Optional<AccessClient>> => {
    if (commonUtils.isEmpty(filter)) {
      return Optional.empty();
    }

    return this.clientRepository.findOneBy(filter);
  };

  public findSecretById = async (
    id: string
  ): Promise<Optional<AccessClient>> => {
    if (commonUtils.isEmpty(id)) {
      return Optional.empty();
    }

    return this.clientRepository.findById(id);
  };

  public findSecret = async (
    clientId: string,
    clientSecret: string
  ): Promise<Optional<AccessClient>> => {
    if (commonUtils.isAnyEmpty(clientId, clientSecret)) {
      return Optional.empty();
    }

    const client: Optional<AccessClient> =
      await this.clientRepository.findOneBy({ clientId });

    if (client.isEmpty()) {
      return Optional.empty();
    }

    const accessClient: AccessClient = client.get();

    if (accessClient.clientSecret !== sha256(clientSecret)) {
      return Optional.empty();
    }

    return Optional.of({ ...accessClient, clientSecret });
  };

  public createSecret = async (
    payload: Partial<AccessClient>
  ): Promise<AccessClient> => {
    const { clientId, clientSecret } = payload;
    Objects.requireNonEmpty(
      [clientId, clientSecret],
      new AuthenticationException('Invalid secret data')
    );

    (await this.clientRepository.findOneBy({ clientId })).ifPresentThrow(
      new AuthenticationException('Client already exists')
    );

    const shaSecret = sha256(clientSecret!);
    const clientData: AccessClient = <AccessClient>{
      ...payload,
      clientId,
      clientSecret: shaSecret
    };

    Objects.requireTrue(
      commonUtils.isSafe(clientData),
      new BadRequestException('Invalid purchase data')
    );

    return await this.clientRepository.create(clientData);
  };

  private getExpiration = (
    expiration: number,
    date: number | undefined
  ): number => {
    return date === undefined || date === 0 ? expiration : date;
  };
}

export { AccessClientService };
