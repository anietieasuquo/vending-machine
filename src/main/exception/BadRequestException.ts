class BadRequestException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestException';
    Object.setPrototypeOf(this, BadRequestException.prototype);
  }
}

export { BadRequestException };
