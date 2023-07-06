import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

export default async () => {
  console.log('### Warming up Mongo Memory Server ###');
  const mongoSrv = new MongoMemoryServer();
  await mongoSrv.start();
  const mongoUri = mongoSrv.getUri();

  const mongoClient = await MongoClient.connect(mongoUri, {});
  const db = mongoClient.db(mongoSrv.instanceInfo?.dbName);

  await db.collections();

  if (mongoClient) {
    await mongoClient.close();
  }
  if (mongoSrv) {
    await mongoSrv.stop({ doCleanup: true });
  }
  console.log('###              Done              ###');
};
