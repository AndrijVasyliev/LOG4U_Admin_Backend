import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from './app.module';

let originalEnvs: any;
let mongoSrv: MongoMemoryServer;

describe('Application root', () => {
  let app: INestApplication;

  beforeAll(async () => {
    originalEnvs = process.env;
    mongoSrv = new MongoMemoryServer();
    await mongoSrv.start();
    const mongoUri = mongoSrv.getUri();
    process.env.MONGO_DSN = mongoUri;

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should return 200 OK on / (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('OK');
  });

  afterAll(async () => {
    await app.close();
    if (mongoSrv) {
      await mongoSrv.stop({ doCleanup: true });
    }
    process.env = originalEnvs;
  });
});
