import {
    ArgumentMetadata,
    BadRequestException,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import * as Joi from 'joi';
import { OwnerQuery } from './owner.dto';
import { OWNER_DEFAULT_LIMIT, OWNER_DEFAULT_OFFSET } from '../utils/constants';


const queryParamsSchema = Joi.object({
    offset: Joi.number().integer().min(0),
    limit: Joi.number().integer().min(1),
    fullName: Joi.string(),
    hiredBy: Joi.string(),
})
    .keys({
        orderby: Joi.string().valid(
            'fullName',
            'hiredBy',
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
        const { error, value } = queryParamsSchema.validate(inputValue);
        if (error) {
            throw new BadRequestException(
                `Query parameters validation failed: ${error.message}, ${JSON.stringify(
                    error.details,
                )}`,
            );
        }
        return {
            offset: OWNER_DEFAULT_OFFSET,
            limit: OWNER_DEFAULT_LIMIT,
            ...value,
        };
    }
}
