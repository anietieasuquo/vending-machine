class InsufficientFundsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientFundsException';
    Object.setPrototypeOf(this, InsufficientFundsException.prototype);
  }
}

export { InsufficientFundsException };
