import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello It works! LastBite API is running Successfully. You can now access the GraphQL playground at /graphql';
  }
}
