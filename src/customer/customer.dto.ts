import { PaginateResult, Types } from 'mongoose';
import { Customer } from './customer.schema';
import { Query, PaginatedResultDto, CustomerType } from '../utils/general.dto';

export interface CreateCustomerDto {
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

export type UpdateCustomerDto = Partial<CreateCustomerDto>;

export interface CustomerQuerySearch {
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

export interface CustomerQueryOrder
  extends Omit<
    CustomerQuerySearch,
    'search' | 'address2' | 'fax' | 'website'
  > {}

export interface CustomerQuery
  extends Query<CustomerQuerySearch, CustomerQueryOrder> {}

export class CustomerResultDto {
  static fromCustomerModel(customer: Customer): CustomerResultDto {
    return {
      id: customer._id,
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

  readonly id: Types.ObjectId;
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
