import {
    ArgumentMetadata,
    BadRequestException,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import * as Joi from 'joi';
import { OwnerQuery } from './owner.dto';
import { LangPriorities, OWNER_DEFAULT_LIMIT, OWNER_DEFAULT_OFFSET } from '../utils/constants';


const queryParamsSchema = Joi.object({
    offset: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).optional(),
    fullName: Joi.string().optional(),
    birthPlace: Joi.string().optional(),
    citizenship: Joi.string().optional(),
    languagePriority: Joi.string().valid(...LangPriorities).optional(),
    hiredBy: Joi.string().optional(),
    snn: Joi.string().optional(),
    company: Joi.string().optional(),
    insurancePolicy: Joi.string().optional(),
    insurancePolicyEFF: Joi.string().optional(),
    address: Joi.string().optional(),
    phone: Joi.string().optional(),
    phone2: Joi.string().optional(),
    email: Joi.string().optional(),
    emergencyContactName: Joi.string().optional(),
    emergencyContactRel: Joi.string().optional(),
    emergencyContactPhone: Joi.string().optional(),
})
    .keys({
        orderby: Joi.string().valid(
          'fullName',
          'birthDate',
          'birthPlace',
          'citizenship',
          'languagePriority',
          'hiredBy',
          'hireDate',
          'snn',
          'company',
          'insurancePolicy',
          'insurancePolicyEFF',
          'insurancePolicyExp',
          'address',
          'phone',
          'phone2',
          'email',
          'emergencyContactName',
          'emergencyContactRel',
          'emergencyContactPhone',
        ),
        direction: Joi.string().valid('asc', 'desc'),
    })
    .and('orderby', 'direction');

@Injectable()
export class OwnerQueryParamsPipe implements PipeTransform<any, OwnerQuery> {
    transform(inputValue: any, metadata: ArgumentMetadata) {
        if (metadata.type !== 'query') {
            return inputValue;
        }
        const { error, value } = queryParamsSchema.validate(inputValue, { abortEarly: false });
        if (error) {
            throw new BadRequestException(
                `Query parameters validation failed: ${error.message}, ${JSON.stringify(
                    error.details,
                )}`,
            );
        }
        const { offset = OWNER_DEFAULT_OFFSET, limit = OWNER_DEFAULT_LIMIT, orderby, direction, ...search } = value;
        let result: OwnerQuery;
        if (Object.keys(search).length) {
            result = {
                offset,
                limit,
                orderby,
                direction,
                search,
            };
        } else {
            result = {
                offset,
                limit,
                orderby,
                direction,
            };
        }
        return result;
    }
}
