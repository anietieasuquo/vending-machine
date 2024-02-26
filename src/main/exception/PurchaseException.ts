class PurchaseException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PurchaseException';
    Object.setPrototypeOf(this, PurchaseException.prototype);
  }
}

export { PurchaseException };
