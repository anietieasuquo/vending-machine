import { logger } from 'tspa';
import dotenv from 'dotenv';
import { ModuleFactory } from '@main/factories/ModuleFactory';
import { app } from '@main/server';

dotenv.config();

const port: string | undefined = process.env.PORT;
if (!port) throw new Error('PORT is not defined');

app.listen(port, async () => {
  await ModuleFactory.getStartupHandler.run();
  return logger.info(`Express is listening at http://localhost:${port}`);
});
