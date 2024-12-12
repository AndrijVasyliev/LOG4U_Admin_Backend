import { PaginateModel, PaginateOptions, Types } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LoggerService } from '../logger';
import { MONGO_CONNECTION_NAME } from '../utils/constants';
import { Customer, CustomerDocument } from './customer.schema';
import {
  CreateCustomerDto,
  CustomerQuery,
  CustomerResultDto,
  PaginatedCustomerResultDto,
  UpdateCustomerDto,
} from './customer.dto';
import { escapeForRegExp } from '../utils/escapeForRegExp';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name, MONGO_CONNECTION_NAME)
    private readonly customerModel: PaginateModel<CustomerDocument>,
    private readonly log: LoggerService,
  ) {}

  private async findCustomerDocumentById(
    id: Types.ObjectId,
  ): Promise<CustomerDocument> {
    this.log.debug(`Searching for Customer ${id}`);
    const customer = await this.customerModel.findOne({ _id: id });
    if (!customer) {
      throw new NotFoundException(`Customer ${id} was not found`);
    }
    this.log.debug(`Customer ${customer._id}`);

    return customer;
  }

  async findCustomerById(id: Types.ObjectId): Promise<CustomerResultDto> {
    const customer = await this.findCustomerDocumentById(id);
    return CustomerResultDto.fromCustomerModel(customer);
  }

  async getCustomers(
    query: CustomerQuery,
  ): Promise<PaginatedCustomerResultDto> {
    this.log.debug(`Searching for Customers: ${JSON.stringify(query)}`);

    const documentQuery: Parameters<typeof this.customerModel.paginate>[0] = {};
    if (query.search) {
      const searchParams = Object.entries(query.search);
      searchParams.forEach((entry) => {
        entry[0] !== 'search' &&
          (documentQuery[entry[0]] = {
            $regex: new RegExp(escapeForRegExp(entry[1]), 'i'),
          });
      });
    }
    if (query?.search?.search) {
      const search = escapeForRegExp(query?.search?.search);
      documentQuery.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { phone: { $regex: new RegExp(search, 'i') } },
        { fax: { $regex: new RegExp(search, 'i') } },
        { email: { $regex: new RegExp(search, 'i') } },
        { website: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const options: PaginateOptions = {
      limit: query.limit,
      offset: query.offset,
    };
    if (query.direction && query.orderby) {
      options.sort = { [query.orderby]: query.direction };
    }

    const res = await this.customerModel.paginate(documentQuery, options);

    return PaginatedCustomerResultDto.from(res);
  }

  async createCustomer(
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResultDto> {
    this.log.debug(
      `Creating new Customer: ${JSON.stringify(createCustomerDto)}`,
    );
    const createdCustomer = new this.customerModel(createCustomerDto);

    this.log.debug('Saving Customer');
    const customer = await createdCustomer.save();
    return CustomerResultDto.fromCustomerModel(customer);
  }

  async updateCustomer(
    id: Types.ObjectId,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResultDto> {
    const customer = await this.findCustomerDocumentById(id);
    this.log.debug(`Setting new values: ${JSON.stringify(updateCustomerDto)}`);
    Object.assign(customer, updateCustomerDto);
    this.log.debug('Saving Customer');
    const savedCustomer = await customer.save();
    this.log.debug(`Customer ${savedCustomer._id} saved`);

    return CustomerResultDto.fromCustomerModel(customer);
  }

  async deleteCustomer(id: Types.ObjectId): Promise<CustomerResultDto> {
    const customer = await this.findCustomerDocumentById(id);

    this.log.debug(`Deleting Customer ${customer._id}`);

    await customer.deleteOne();
    this.log.debug('Customer deleted');

    return CustomerResultDto.fromCustomerModel(customer);
  }
}
