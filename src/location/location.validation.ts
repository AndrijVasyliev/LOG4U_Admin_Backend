import * as Joi from 'joi';

export const CreateLocationValidation = Joi.object({
    zipCode: Joi.string().required(),
    name: Joi.string().required(),
    stateCode: Joi.string().required(),
    stateName: Joi.string().required(),
});

export const UpdateLocationValidation = Joi.object({
    zipCode: Joi.string().optional(),
    name: Joi.string().optional(),
    stateCode: Joi.string().optional(),
    stateName: Joi.string().optional(),
});

export const locationQueryParamsSchema = Joi.object({
    offset: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).optional(),
    zipCode: Joi.string().optional(),
    name: Joi.string().optional(),
    stateCode: Joi.string().optional(),
    stateName: Joi.string().optional(),
})
  .keys({
      orderby: Joi.string().valid(
        'zipCode',
        'name',
        'stateCode',
        'stateName',
      ),
      direction: Joi.string().valid('asc', 'desc'),
  })
  .and('orderby', 'direction');
