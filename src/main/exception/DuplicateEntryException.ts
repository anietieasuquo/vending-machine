class DuplicateEntryException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateEntryException';
    Object.setPrototypeOf(this, DuplicateEntryException.prototype);
  }
}

export { DuplicateEntryException };
