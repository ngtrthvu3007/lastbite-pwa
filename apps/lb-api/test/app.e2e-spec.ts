import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from './../src/app.module';
import { RedisService } from '../src/redis/redis.module';
import { TEST_API_ENV, useTestEnvironment } from '../src/test-support/test-environment';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let restoreEnvironment: () => void;

  beforeAll(async () => {
    restoreEnvironment = useTestEnvironment(TEST_API_ENV);
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RedisService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    restoreEnvironment();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(
        'Hello It works! LastBite API is running Successfully. You can now access the GraphQL playground at /graphql',
      );
  });
});
