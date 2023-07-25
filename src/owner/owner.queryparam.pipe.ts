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
    offset: Joi.number().integer().min(0),
    limit: Joi.number().integer().min(1),
    fullName: Joi.string(),
    citizenship: Joi.string(),
    languagePriority: Joi.string().valid(...LangPriorities),
    hiredBy: Joi.string(),
    snn: Joi.string(),
    company: Joi.string(),
    insurancePolicy: Joi.string(),
    insurancePolicyEFF: Joi.string(),
    address: Joi.string(),
    phone: Joi.string(),
    phone2: Joi.string(),
    email: Joi.string(),
    emergencyContactName: Joi.string(),
    emergencyContactRel: Joi.string(),
    emergencyContactPhone: Joi.string(),
})
    .keys({
        orderby: Joi.string().valid(
          'fullName',
          'birthDate',
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
