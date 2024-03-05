import {
  commonUtils,
  logger,
  LogicalOperator,
  Objects,
  Optional,
  TransactionalCrudRepository
} from 'tspa';
import { AccessClient, AccessToken, AccessTokenType } from '@main/types/store';
import { generateSha256, getScope, sha256 } from '@main/util/commons';
import { OAuth2AccessClient, OAuth2RefreshToken } from '@main/types/web';
import { AuthenticationException } from '@main/exception/AuthenticationException';
import { UserDto } from '@main/types/dto';
import { BadRequestException } from '@main/exception/BadRequestException';
import { AccessClientService } from '@main/services/AccessClientService';

class TokenService {
  public static readonly SUPPORTED_GRANTS: string[] = [
    'password',
    'client_credentials',
    'authorization_code',
    'refresh_token'
  ];

  public constructor(
    private readonly tokenRepository: TransactionalCrudRepository<AccessToken>,
    private readonly accessClientService: AccessClientService
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
    Objects.requireNonEmpty(
      [accessToken, refreshToken, userId, clientId, type],
      new AuthenticationException('Invalid token data')
    );

    const tokenData = {
      type: type!,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      userId: userId!,
      scope: getScope(scope),
      clientId: clientId!
    };

    Objects.requireTrue(
      commonUtils.isSafe(tokenData),
      new BadRequestException('Invalid token data')
    );

    const newToken: AccessToken = await this.tokenRepository.create(tokenData);

    logger.debug('Token saved:', newToken.id);
    return newToken;
  };

  public findAccessToken = async (
    accessToken: string
  ): Promise<Optional<AccessToken>> => {
    if (commonUtils.isEmpty(accessToken)) {
      return Optional.empty();
    }

    return this.tokenRepository.findOneBy({ accessToken });
  };

  public findRefreshToken = async (
    refreshToken: string
  ): Promise<Optional<AccessToken>> => {
    if (commonUtils.isEmpty(refreshToken)) {
      return Optional.empty();
    }

    return this.tokenRepository.findOneBy({ refreshToken });
  };

  public findToken = async (token: string): Promise<Optional<AccessToken>> => {
    if (commonUtils.isEmpty(token)) {
      return Optional.empty();
    }

    return this.tokenRepository.findOneBy(
      { accessToken: token, refreshToken: token },
      { logicalOperator: LogicalOperator.OR }
    );
  };

  public revokeToken = async (
    oAuth2RefreshToken: OAuth2RefreshToken
  ): Promise<boolean> => {
    Objects.requireNonEmpty(
      oAuth2RefreshToken,
      new AuthenticationException('Invalid token data')
    );

    const { refreshToken, user, client } = oAuth2RefreshToken;

    const token: Optional<AccessToken> = await this.tokenRepository.findOneBy({
      refreshToken
    });
    if (token.isEmpty()) {
      return false;
    }

    const tokenData: AccessToken = token.get();
    if (tokenData.userId !== user?.id || tokenData.clientId !== client?.id) {
      return false;
    }

    return this.tokenRepository.remove(tokenData.id!);
  };

  public generateToken = async (
    type: AccessTokenType,
    client: OAuth2AccessClient,
    user: UserDto,
    scope: string[]
  ): Promise<string> => {
    const { id, secret } = client;
    Objects.requireNonEmpty(
      [id, secret],
      new AuthenticationException('Invalid client data')
    );

    const clientId: string = id!;
    const clientSecret: string = secret!;

    const accessClient: AccessClient = (
      await this.accessClientService.findSecretBy({ clientId })
    ).orElseThrow(new AuthenticationException('Client does not exist'));

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

    await this.saveToken(newToken);

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
