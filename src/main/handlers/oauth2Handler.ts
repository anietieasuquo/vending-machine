import {
  AccessClient,
  AccessToken,
  AccessTokenType,
  Role
} from '@main/types/store';
import {
  Oauth2AuthHandler,
  OAuth2AccessClient,
  OAuth2AccessToken,
  OAuth2RefreshToken,
  OAuth2Tokens
} from '@main/types/web';
import { UserService } from '@main/services/UserService';
import { TokenService } from '@main/services/TokenService';
import { RoleService } from '@main/services/RoleService';
import { commonUtils, logger } from 'tspa';
import { UserDto } from '@main/types/dto';
import { AuthenticationException } from '@main/exception/AuthenticationException';
import { fromAccessClientToOAuth2AccessClient } from '@main/util/mapper';
import { getScope } from '@main/util/commons';

let userService: UserService;
let tokenService: TokenService;
let roleService: RoleService;
const getClient = async (
  clientId: string,
  clientSecret: string
): Promise<OAuth2AccessClient | undefined> => {
  //TODO: This should ideally be stored in AWS Secrets Manager, KMS, but I don't have the time to set that up right now
  logger.info('Getting client:', { clientId, clientSecret });
  const client: AccessClient | undefined = await tokenService.findSecret(
    clientId,
    clientSecret
  );

  if (!client) {
    logger.info('Unrecognized client:', clientId);
    return undefined;
  }

  return fromAccessClientToOAuth2AccessClient(client);
};

const getUser = async (
  username: string,
  password: string,
  client: OAuth2AccessClient
): Promise<UserDto | undefined> => {
  logger.info('Getting user:', { username, password, client });
  const user = await userService.findUserByUsernameAndPassword(
    username,
    password
  );

  logger.debug('Found user:', user);
  if (!user || user.machineId !== client.machineId) return undefined;
  return user;
};

const saveToken = async (
  token: Partial<OAuth2Tokens>,
  client: OAuth2AccessClient,
  user: UserDto
): Promise<OAuth2Tokens> => {
  logger.info('Saving token:', { token, client, user });
  const {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    scope
  } = token;
  if (
    commonUtils.isAnyEmpty(user.id, client.id, client.machineId) ||
    (commonUtils.isEmpty(accessToken) && commonUtils.isEmpty(refreshToken))
  ) {
    throw new AuthenticationException('Invalid token data');
  }

  const _accessToken: AccessToken = {
    type: commonUtils.isEmpty(accessToken) ? 'refresh' : 'access',
    userId: user.id!,
    clientId: client.id!,
    accessToken: accessToken || '',
    accessTokenExpiresAt: accessTokenExpiresAt
      ? new Date(accessTokenExpiresAt).getTime()
      : 0,
    refreshToken: refreshToken || '',
    refreshTokenExpiresAt: refreshTokenExpiresAt
      ? new Date(refreshTokenExpiresAt).getTime()
      : 0,
    scope: scope || []
  };

  const newToken: AccessToken = await tokenService.saveToken(_accessToken);
  if (!newToken) throw new AuthenticationException('Failed to save token');

  return {
    accessToken: accessToken || '',
    refreshToken: refreshToken || '',
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    scope: getScope(newToken.scope),
    user,
    client
  };
};

const getAccessToken = async (
  accessToken: string
): Promise<OAuth2AccessToken | undefined> => {
  logger.info('Getting access token:', accessToken);
  const token: AccessToken | undefined =
    await tokenService.findTokenByAccessToken(accessToken);
  if (!token || commonUtils.isEmpty(token.accessToken)) return undefined;
  const { accessTokenExpiresAt, userId } = token;
  const user: UserDto | undefined = await userService.findUserById(userId);
  if (!user) return undefined;
  const client: AccessClient | undefined = await tokenService.findSecretBy({
    clientId: token.clientId
  });
  if (!client) return undefined;

  return {
    accessToken,
    accessTokenExpiresAt: accessTokenExpiresAt
      ? new Date(accessTokenExpiresAt)
      : undefined,
    user,
    client: fromAccessClientToOAuth2AccessClient(client),
    scope: getScope(token.scope)
  };
};

const getRefreshToken = async (
  refreshToken: string
): Promise<OAuth2RefreshToken | undefined> => {
  logger.info('Getting refresh token:', refreshToken);
  const token: AccessToken | undefined =
    await tokenService.findTokenByRefreshToken(refreshToken);
  if (!token) return undefined;
  const { refreshTokenExpiresAt, userId } = token;
  const user: UserDto | undefined = await userService.findUserById(userId);
  if (!user) return undefined;
  const client: AccessClient | undefined = await tokenService.findSecretBy({
    clientId: token.clientId
  });
  if (!client) return undefined;

  return {
    refreshToken,
    refreshTokenExpiresAt: refreshTokenExpiresAt
      ? new Date(refreshTokenExpiresAt)
      : undefined,
    user,
    client: fromAccessClientToOAuth2AccessClient(client),
    scope: getScope(token.scope)
  };
};

const generateToken = async (
  type: AccessTokenType,
  client: OAuth2AccessClient,
  user: UserDto,
  scope: string[]
): Promise<string> => {
  if (commonUtils.isAnyEmpty(user.id, client.id)) {
    throw new AuthenticationException('Invalid user or client');
  }

  return tokenService.generateToken(type, client, user, scope);
};

const generateRefreshToken = async (
  client: OAuth2AccessClient,
  user: UserDto,
  scope: string[]
): Promise<string> => {
  logger.info('Generating refresh token:', { client, user, scope });
  return generateToken('refresh', client, user, scope);
};

const generateAccessToken = async (
  client: OAuth2AccessClient,
  user: UserDto,
  scope: string[]
): Promise<string> => {
  logger.info('Generating access token:', { client, user, scope });
  return generateToken('access', client, user, scope);
};

const verifyScope = async (
  token: OAuth2AccessToken,
  scope: string | string[]
): Promise<boolean> => {
  logger.info('Verifying scope:', { token, scope });
  const scopes: string[] = Array.isArray(scope) ? scope : [scope];
  if (scopes.length === 0) return false;
  const { accessToken } = token;
  const _token = await getAccessToken(accessToken);
  if (!_token) return false;
  return scopes.every((s) => _token.scope!.includes(s));
};

const getUserFromClient = async (
  client: OAuth2AccessClient
): Promise<UserDto | undefined> => {
  logger.info('Getting user from client:', client);
  const { id, secret } = client;
  const clientData: OAuth2AccessClient | undefined = await getClient(
    id,
    secret
  );
  if (!clientData) return undefined;
  const user: UserDto | undefined = await userService.findBy({ machineId: id });
  if (!user) return undefined;
  return { id: user.id!, username: user.username! } as UserDto;
};

const revokeToken = async (refreshToken: string): Promise<boolean> => {
  logger.info('Revoking token:', refreshToken);
  return await tokenService.revokeToken(refreshToken);
};

const validateScope = async (
  user: UserDto,
  client: OAuth2AccessClient,
  scope: string | string[] = []
): Promise<string[] | undefined> => {
  logger.info('Validating scope:', { user, client, scope });
  if (commonUtils.isAnyEmpty(scope, user.id, client.id)) {
    logger.error('Invalid validation data 1', { user, client, scope });
    return undefined;
  }

  const scopes: string[] = getScope(scope);
  if (scopes.length === 0) {
    logger.error('Invalid validation data 2', { user, client, scope });
    return undefined;
  }

  const clientData: OAuth2AccessClient | undefined = await getClient(
    client.id,
    client.secret
  );

  if (!clientData) {
    logger.error('Invalid validation data 3', { user, client, scope });
    return undefined;
  }

  const userFromClient: UserDto | undefined = await userService.findUserById(
    user.id
  );
  if (!userFromClient || userFromClient.machineId !== client.machineId) {
    logger.error('Invalid validation data 4', { user, client, scope });
    return undefined;
  }

  const role: Role | undefined = await roleService.findRoleById(
    userFromClient.roleId
  );

  if (!role || role.privileges.length === 0) {
    logger.error('Invalid validation data 5', { user, client, scope });
    return undefined;
  }
  const check = scopes.every(
    (s) => role.name.toLowerCase() === s.toLowerCase()
  );
  logger.info('Validating scope > valid scopes?:', { check, scopes });
  return check ? scopes : undefined;
};

export default (
  injectedUserService: UserService,
  injectedTokenService: TokenService,
  injectedRoleService: RoleService
): Oauth2AuthHandler => {
  userService = injectedUserService;
  tokenService = injectedTokenService;
  roleService = injectedRoleService;
  logger.info('oauth2Handler initialized');

  return {
    getClient,
    saveToken,
    getAccessToken,
    getRefreshToken,
    generateRefreshToken,
    generateAccessToken,
    revokeToken,
    validateScope,
    verifyScope,
    getUser,
    getUserFromClient
  };
};
