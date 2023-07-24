import {
    ArgumentMetadata,
    BadRequestException,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import * as Joi from 'joi';
import { AuditQuery } from './audit.dto';
import { AUDIT_DEFAULT_LIMIT, AUDIT_DEFAULT_OFFSET } from '../utils/constants';

const queryParamsSchema = Joi.object({
    offset: Joi.number().integer().min(0),
    limit: Joi.number().integer().min(1),
    dateTo: Joi.date()
        .iso()
        .when('dateFrom', {
            not: Joi.exist(),
            then: Joi.any(),
            otherwise: Joi.date().iso().min(Joi.ref('dateFrom')),
        }),
    dateFrom: Joi.date().iso(),
    eventName: Joi.string(),
    eventType: Joi.string(),
    memberId: Joi.string(),
    itemType: Joi.string(),
    brand: Joi.string(),
    itemId: Joi.string().when('itemType', {
        is: Joi.exist(),
        then: Joi.any(),
        otherwise: Joi.forbidden(),
    }),
})
    .keys({
        orderby: Joi.string().valid(
            'date',
            'eventName',
            'eventType',
            'member.id',
            'member.name',
            'itemType',
            'brand',
        ),
        direction: Joi.string().valid('asc', 'desc'),
    })
    .and('orderby', 'direction');

@Injectable()
export class OwnerQueryParamsPipe implements PipeTransform<any, AuditQuery> {
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
            offset: AUDIT_DEFAULT_OFFSET,
            limit: AUDIT_DEFAULT_LIMIT,
            ...value,
        };
    }
}
