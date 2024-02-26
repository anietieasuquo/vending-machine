class AccessForbiddenException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccessForbiddenException';
    Object.setPrototypeOf(this, AccessForbiddenException.prototype);
  }
}

export { AccessForbiddenException };
