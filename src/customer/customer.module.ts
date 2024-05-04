import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerController } from './customer.controller';
import { Customer, CustomerSchema } from './customer.schema';
import { CustomerService } from './customer.service';
import { MONGO_CONNECTION_NAME } from '../utils/constants';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Customer.name, schema: CustomerSchema }],
      MONGO_CONNECTION_NAME,
    ),
  ],
  exports: [CustomerService],
  controllers: [CustomerController],
  providers: [CustomerService],
})
export class CustomerModule {}
