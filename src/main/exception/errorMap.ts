const errorMap: { [key: string]: number } = {
  BadRequestException: 400,
  AuthenticationException: 401,
  UnauthorizedError: 401,
  InvalidArgumentError: 401,
  InsufficientScopeError: 401,
  InvalidRequestError: 401,
  InvalidTokenError: 401,
  OAuthError: 401,
  UnauthorizedRequestError: 401,
  ServerError: 401,
  InvalidScopeError: 401,
  InvalidClientError: 401,
  InvalidGrantError: 401,
  InvalidClientMetadataError: 401,
  InvalidAuthorizationError: 401,
  InvalidRedirectUriError: 401,
  InvalidClientCredentialsError: 401,
  UnauthorizedClientError: 401,
  InsufficientFundsException: 402,
  AccessForbiddenException: 403,
  NotFoundException: 404,
  OutOfStockException: 409,
  DuplicateEntryException: 409,
  InternalServerException: 500
};

export { errorMap };
