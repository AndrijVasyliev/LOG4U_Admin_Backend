import * as Joi from 'joi';
import { LangPriorities } from '../utils/constants';

export const CreateOwnerValidation = Joi.object({
    fullName: Joi.string().required(),
    birthDate: Joi.date().iso().required(),
    birthPlace: Joi.string().required(),
    citizenship: Joi.string().required(),
    languagePriority: Joi.string().valid(...LangPriorities).required(),
    hiredBy: Joi.string().required(),
    hireDate: Joi.date().iso().required(),
    snn: Joi.string().required(),
    company: Joi.string().required(),
    insurancePolicy: Joi.string().required(),
    insurancePolicyEFF: Joi.string().required(),
    insurancePolicyExp: Joi.date().iso().required(),
    address: Joi.string().required(),
    phone: Joi.string().required(),
    phone2: Joi.string().optional(),
    email: Joi.string().required(),
    emergencyContactName: Joi.string().required(),
    emergencyContactRel: Joi.string().optional(),
    emergencyContactPhone: Joi.string().required(),
    notes: Joi.string().optional(),
});

export const UpdateOwnerValidation = Joi.object({
    fullName: Joi.string().optional(),
    birthDate: Joi.date().iso().optional(),
    birthPlace: Joi.string().optional(),
    citizenship: Joi.string().optional(),
    languagePriority: Joi.string().valid(...LangPriorities).optional(),
    hiredBy: Joi.string().optional(),
    hireDate: Joi.date().iso().optional(),
    snn: Joi.string().optional(),
    company: Joi.string().optional(),
    insurancePolicy: Joi.string().optional(),
    insurancePolicyEFF: Joi.string().optional(),
    insurancePolicyExp: Joi.date().iso().optional(),
    address: Joi.string().optional(),
    phone: Joi.string().optional(),
    phone2: Joi.string().optional(),
    email: Joi.string().optional(),
    emergencyContactName: Joi.string().optional(),
    emergencyContactRel: Joi.string().optional(),
    emergencyContactPhone: Joi.string().optional(),
    notes: Joi.string().optional(),
});

