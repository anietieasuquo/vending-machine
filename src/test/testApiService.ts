import { Request, Response } from 'express';

const helloWord = (_req: Request, res: Response) => {
  res.send('Hello World!');
};

export default () => {
  return { helloWord };
};
