import { commonUtils, CrudRepository, logger, LogicalOperator } from 'tspa';
import { AccessClient, AccessToken, AccessTokenType } from '@main/types/store';
import { generateSha256, getScope, sha256 } from '@main/util/commons';
import { OAuth2AccessClient } from '@main/types/web';
import { AuthenticationException } from '@main/exception/AuthenticationException';
import { UserDto } from '@main/types/dto';

class TokenService {
  public static readonly SUPPORTED_GRANTS: string[] = [
    'password',
    'client_credentials'
  ];

  public constructor(
    private readonly tokenRepository: CrudRepository<AccessToken>,
    private readonly clientRepository: CrudRepository<AccessClient>
  ) {}

  public saveToken = async (
    token: Partial<AccessToken>
  ): Promise<AccessToken> => {
    const {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      userId,
      scope,
      clientId,
      type
    } = token;
    if ((!accessToken && !refreshToken) || !userId || !clientId || !type) {
      throw new AuthenticationException('Invalid token data');
    }

    const newToken: AccessToken | undefined = await this.tokenRepository.create(
      {
        type,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        userId,
        scope: getScope(scope),
        clientId
      }
    );

    if (!newToken) {
      throw new AuthenticationException('Failed to create token');
    }

    logger.debug('Token saved:', newToken);
    return newToken;
  };

  public findTokenByAccessToken = async (
    accessToken: string
  ): Promise<AccessToken | undefined> => {
    if (commonUtils.isEmpty(accessToken)) {
      return undefined;
    }

    return this.tokenRepository.findOneBy({ accessToken });
  };

  public findTokenByRefreshToken = async (
    refreshToken: string
  ): Promise<AccessToken | undefined> => {
    if (commonUtils.isEmpty(refreshToken)) {
      return undefined;
    }

    return this.tokenRepository.findOneBy({ refreshToken });
  };

  public findToken = async (
    token: string
  ): Promise<AccessToken | undefined> => {
    if (commonUtils.isEmpty(token)) {
      return undefined;
    }

    return this.tokenRepository.findOneBy(
      { accessToken: token, refreshToken: token },
      { logicalOperator: LogicalOperator.OR }
    );
  };

  public findSecretBy = async (
    filter: Partial<AccessClient>
  ): Promise<AccessClient | undefined> => {
    if (commonUtils.isEmpty(filter)) {
      return undefined;
    }

    return this.clientRepository.findOneBy(filter);
  };

  public findSecretById = async (
    id: string
  ): Promise<AccessClient | undefined> => {
    if (commonUtils.isEmpty(id)) {
      throw new AuthenticationException('Invalid secret data');
    }

    return this.clientRepository.findById(id);
  };

  public findSecret = async (
    clientId: string,
    clientSecret: string
  ): Promise<AccessClient | undefined> => {
    logger.info('Finding secret:', { clientId, clientSecret });
    if (commonUtils.isAnyEmpty(clientId, clientSecret)) {
      logger.warn('Invalid secret data:', { clientId, clientSecret });
      return undefined;
    }

    const client: AccessClient | undefined =
      await this.clientRepository.findOneBy({ clientId });

    if (!client) {
      logger.info('Client not found:', { clientId });
      return undefined;
    }

    if (client.clientSecret !== sha256(clientSecret)) {
      logger.info('Unauthorized client:', clientId);
      return undefined;
    }

    return { ...client, clientSecret };
  };

  public revokeToken = async (refreshToken: string): Promise<boolean> => {
    if (commonUtils.isEmpty(refreshToken)) {
      throw new AuthenticationException('Invalid token data');
    }

    const token: AccessToken | undefined = await this.tokenRepository.findOneBy(
      {
        refreshToken
      }
    );
    if (!token) return false;

    return await this.tokenRepository.remove(token.id!);
  };

  public createSecret = async (
    payload: Partial<AccessClient>
  ): Promise<AccessClient> => {
    logger.info('Creating secret', payload);
    const { clientId, clientSecret } = payload;
    if (commonUtils.isAnyEmpty(clientId, clientSecret)) {
      throw new AuthenticationException('Invalid secret data');
    }

    const accessClient: AccessClient | undefined =
      await this.clientRepository.findOneBy({ clientId });
    if (accessClient) {
      throw new AuthenticationException('Client already exists');
    }

    const shaSecret = sha256(clientSecret!);
    const newSecret: AccessClient | undefined =
      await this.clientRepository.create(<AccessClient>{
        ...payload,
        clientId,
        clientSecret: shaSecret
      });

    if (!newSecret) {
      throw new AuthenticationException('Failed to create token');
    }
    return newSecret;
  };

  public generateToken = async (
    type: AccessTokenType,
    client: OAuth2AccessClient,
    user: UserDto,
    scope: string[]
  ): Promise<string> => {
    const { id, secret } = client;
    if (commonUtils.isAnyEmpty(id, secret)) {
      throw new AuthenticationException('Invalid client data');
    }

    const clientId: string = id!;
    const clientSecret: string = secret!;

    const accessClient: AccessClient | undefined =
      await this.clientRepository.findOneBy({ clientId });
    if (!accessClient) {
      throw new AuthenticationException('Client does not exist');
    }

    const shaSecret = sha256(clientSecret);
    if (accessClient.clientSecret !== shaSecret) {
      throw new AuthenticationException('Invalid client secret');
    }

    const { id: userId } = user;
    const expiration = commonUtils.addDaysToTimestamp(Date.now(), 1);
    const accessTokenExpiresAt = this.getExpiration(
      expiration,
      client.accessTokenLifetime
    );
    const refreshTokenExpiresAt = this.getExpiration(
      expiration,
      client.refreshTokenLifetime
    );
    const token: string = generateSha256();

    const newToken: AccessToken = {
      type,
      accessToken: token,
      refreshToken: token,
      userId,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      scope,
      clientId
    };

    const accessToken: AccessToken | undefined = await this.saveToken(newToken);
    if (!accessToken) {
      throw new AuthenticationException('Failed to create token');
    }

    return token;
  };

  private getExpiration = (
    expiration: number,
    date: number | undefined
  ): number => {
    return date === undefined || date === 0 ? expiration : date;
  };
}

export { TokenService };
