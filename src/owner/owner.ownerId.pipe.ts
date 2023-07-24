import * as Joi from 'joi';
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export const OwnerOwnerIdValidation = Joi.string().hex().length(24).required();

@Injectable()
export class OwnerOwnerIdPipe implements PipeTransform<any, string> {
    transform(value: any): string {
        const { error } = OwnerOwnerIdValidation.validate(value);
        if (error) {
            throw new BadRequestException(
                `Owner Id validation failed: ${error.message}, ${JSON.stringify(
                    error.details,
                )}`,
            );
        }

        return value;
    }
}
