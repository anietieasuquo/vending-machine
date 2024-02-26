class OutOfStockException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutOfStockException';
    Object.setPrototypeOf(this, OutOfStockException.prototype);
  }
}

export { OutOfStockException };
