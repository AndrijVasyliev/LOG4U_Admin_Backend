import { PaginateResult } from 'mongoose';
import { Customer } from './customer.schema';
import { Query, PaginatedResultDto, CustomerType } from '../utils/general.dto';

export class CreateCustomerDto {
  readonly name: string;
  readonly type: CustomerType;
  readonly address: string;
  readonly address2?: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly phone: string;
  readonly fax?: string;
  readonly email: string;
  readonly website?: string;
}

export class UpdateCustomerDto {
  readonly name?: string;
  readonly type?: CustomerType;
  readonly address?: string;
  readonly address2?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zipCode?: string;
  readonly phone?: string;
  readonly fax?: string;
  readonly email?: string;
  readonly website?: string;
}

export class CustomerQuerySearch {
  readonly search?: string;
  readonly name?: string;
  readonly type?: CustomerType;
  readonly address?: string;
  readonly address2?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zipCode?: string;
  readonly phone?: string;
  readonly fax?: string;
  readonly email?: string;
  readonly website?: string;
}

export class CustomerQuery extends Query<CustomerQuerySearch> {}

export class CustomerResultDto {
  static fromCustomerModel(customer: Customer): CustomerResultDto {
    return {
      id: customer._id.toString(),
      name: customer.name,
      type: customer.type,
      address: customer.address,
      address2: customer.address2,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      phone: customer.phone,
      fax: customer.fax,
      email: customer.email,
      website: customer.website,
    };
  }

  readonly id: string;
  readonly name: string;
  readonly type: CustomerType;
  readonly address: string;
  readonly address2?: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
  readonly phone: string;
  readonly fax?: string;
  readonly email: string;
  readonly website?: string;
}

export class PaginatedCustomerResultDto extends PaginatedResultDto<CustomerResultDto> {
  static from(
    paginatedCustomers: PaginateResult<Customer>,
  ): PaginatedCustomerResultDto {
    return {
      items: paginatedCustomers.docs.map((customer) =>
        CustomerResultDto.fromCustomerModel(customer),
      ),
      offset: paginatedCustomers.offset,
      limit: paginatedCustomers.limit,
      total: paginatedCustomers.totalDocs,
    };
  }
}
