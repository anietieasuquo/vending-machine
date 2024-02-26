class AuthenticationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationException';
    Object.setPrototypeOf(this, AuthenticationException.prototype);
  }
}

export { AuthenticationException };
