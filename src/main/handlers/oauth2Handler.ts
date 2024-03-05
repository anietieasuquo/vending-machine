import {
  AccessClient,
  AccessToken,
  AccessTokenType,
  Role,
  User
} from '@main/types/store';
import {
  OAuth2AccessClient,
  OAuth2AccessToken,
  Oauth2AuthHandler,
  OAuth2RefreshToken,
  OAuth2Tokens
} from '@main/types/web';
import { UserService } from '@main/services/UserService';
import { TokenService } from '@main/services/TokenService';
import { RoleService } from '@main/services/RoleService';
import { commonUtils, Objects, Optional } from 'tspa';
import { UserDto } from '@main/types/dto';
import { AuthenticationException } from '@main/exception/AuthenticationException';
import {
  fromAccessClientToOAuth2AccessClient,
  fromUserToUserDto
} from '@main/util/mapper';
import { getScope } from '@main/util/commons';
import { AccessClientService } from '@main/services/AccessClientService';

let userService: UserService;
let tokenService: TokenService;
let roleService: RoleService;
let accessClientService: AccessClientService;
const getClient = async (
  clientId: string,
  clientSecret: string
): Promise<OAuth2AccessClient | undefined> => {
  //TODO: This should ideally be stored in AWS Secrets Manager, KMS, but I don't have the time to set that up right now.
  const client: Optional<AccessClient> = await accessClientService.findSecret(
    clientId,
    clientSecret
  );

  if (client.isEmpty()) {
    return undefined;
  }

  const authClient = client.get();
  return fromAccessClientToOAuth2AccessClient(authClient);
};

const getUser = async (
  username: string,
  password: string,
  client: OAuth2AccessClient
): Promise<UserDto | undefined> => {
  const user: Optional<User> = await userService.findUserByUsernameAndPassword(
    username,
    password
  );

  if (user.isEmpty() || user.get().machineId !== client.machineId) {
    return undefined;
  }
  const authUser = user.get();
  return fromUserToUserDto(authUser);
};

const saveToken = async (
  token: Partial<OAuth2Tokens>,
  client: OAuth2AccessClient,
  user: UserDto
): Promise<OAuth2Tokens> => {
  const {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    scope
  } = token;
  Objects.requireNonEmpty(
    [user.id, client.id, client.machineId],
    new AuthenticationException('Invalid token data')
  );
  if (commonUtils.isEmpty(accessToken) && commonUtils.isEmpty(refreshToken)) {
    throw new AuthenticationException('Invalid token data');
  }

  const newAccessToken: AccessToken = {
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

  const newToken: AccessToken = await tokenService.saveToken(newAccessToken);

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
  const token: Optional<AccessToken> =
    await tokenService.findAccessToken(accessToken);

  if (token.isEmpty()) {
    return undefined;
  }

  const { accessTokenExpiresAt, userId, clientId, scope } = token.get();

  const user: Optional<User> = await userService.findUserById(userId);
  if (user.isEmpty()) {
    return undefined;
  }

  const client: Optional<AccessClient> = await accessClientService.findSecretBy(
    {
      clientId
    }
  );

  if (client.isEmpty()) {
    return undefined;
  }

  return {
    accessToken,
    accessTokenExpiresAt: accessTokenExpiresAt
      ? new Date(accessTokenExpiresAt)
      : undefined,
    user: fromUserToUserDto(user.get()),
    client: fromAccessClientToOAuth2AccessClient(client.get()),
    scope: getScope(scope)
  };
};

const getRefreshToken = async (
  refreshToken: string
): Promise<OAuth2RefreshToken | undefined> => {
  const token: Optional<AccessToken> =
    await tokenService.findRefreshToken(refreshToken);
  if (token.isEmpty()) {
    return undefined;
  }

  const { refreshTokenExpiresAt, userId, clientId, scope } = token.get();

  const user: Optional<User> = await userService.findUserById(userId);
  if (user.isEmpty()) {
    return undefined;
  }

  const client: Optional<AccessClient> = await accessClientService.findSecretBy(
    {
      clientId
    }
  );

  if (client.isEmpty()) {
    return undefined;
  }

  return {
    refreshToken,
    refreshTokenExpiresAt: refreshTokenExpiresAt
      ? new Date(refreshTokenExpiresAt)
      : undefined,
    user: fromUserToUserDto(user.get()),
    client: fromAccessClientToOAuth2AccessClient(client.get()),
    scope: getScope(scope)
  };
};

const generateToken = async (
  type: AccessTokenType,
  client: OAuth2AccessClient,
  user: UserDto,
  scope: string[]
): Promise<string> => {
  Objects.requireNonEmpty(
    [user.id, client.id],
    new AuthenticationException('Invalid user or client')
  );

  return tokenService.generateToken(type, client, user, scope);
};

const generateRefreshToken = async (
  client: OAuth2AccessClient,
  user: UserDto,
  scope: string[]
): Promise<string> => {
  return generateToken('refresh', client, user, scope);
};

const generateAccessToken = async (
  client: OAuth2AccessClient,
  user: UserDto,
  scope: string[]
): Promise<string> => {
  return generateToken('access', client, user, scope);
};

const verifyScope = async (
  token: OAuth2AccessToken,
  scope: string | string[]
): Promise<boolean> => {
  const scopes: string[] = Array.isArray(scope) ? scope : [scope];
  if (scopes.length === 0) return false;
  const { accessToken } = token;
  const existingToken = await getAccessToken(accessToken);
  if (!existingToken) return false;
  return scopes.every((s) => existingToken.scope!.includes(s));
};

const getUserFromClient = async (
  client: OAuth2AccessClient
): Promise<UserDto | undefined> => {
  const { id, secret } = client;
  const clientData: OAuth2AccessClient | undefined = await getClient(
    id,
    secret
  );
  if (!clientData) return undefined;
  const user: Optional<User> = await userService.findOneBy({
    machineId: id
  });
  if (user.isEmpty()) return undefined;
  return user.map((u) => fromUserToUserDto(u)).get();
};

const revokeToken = async (
  refreshToken: OAuth2RefreshToken
): Promise<boolean> => {
  return await tokenService.revokeToken(refreshToken);
};

const validateScope = async (
  user: UserDto,
  client: OAuth2AccessClient,
  scope: string | string[] = []
): Promise<string[] | undefined> => {
  if (commonUtils.isAnyEmpty(scope, user.id, client.id)) {
    return undefined;
  }

  const scopes: string[] = getScope(scope);
  if (scopes.length === 0) {
    return undefined;
  }

  const clientData: OAuth2AccessClient | undefined = await getClient(
    client.id,
    client.secret
  );

  if (!clientData) {
    return undefined;
  }

  const userFromClient: Optional<User> = await userService.findUserById(
    user.id
  );
  if (
    userFromClient.isEmpty() ||
    userFromClient.get().machineId !== client.machineId
  ) {
    return undefined;
  }

  const role: Optional<Role> = await roleService.findRoleById(
    userFromClient.get().roleId
  );

  if (role.isEmpty() || role.get().privileges.length === 0) {
    return undefined;
  }
  const check = scopes.every(
    (s) => role.get().name.toLowerCase() === s.toLowerCase()
  );
  return check ? scopes : undefined;
};

export default (
  injectedUserService: UserService,
  injectedTokenService: TokenService,
  injectedAccessClientService: AccessClientService,
  injectedRoleService: RoleService
): Oauth2AuthHandler => {
  userService = injectedUserService;
  tokenService = injectedTokenService;
  accessClientService = injectedAccessClientService;
  roleService = injectedRoleService;

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
