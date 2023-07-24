import * as Joi from 'joi';
import {
    MAX_OPERATOR_ID_LENGTH,
    MIN_OPERATOR_ID_LENGTH,
    OPERATOR_ID_REGEXP,
    MIN_OPERATOR_NAME_LENGTH,
    MAX_OPERATOR_NAME_LENGTH, LangPriorities,
} from '../utils/constants';
import {LangPriority} from "./owner.dto";

export const CreateOwnerValidation = Joi.object({
    fullName: Joi.string().required(),
    birthDate: Joi.date().iso().required(),
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
    phone2: Joi.string(),
    email: Joi.string().required(),
    emergencyContactName: Joi.string().required(),
    emergencyContactRel: Joi.string(),
    emergencyContactPhone: Joi.string().required(),
    notes: Joi.string(),
});

export const UpdateOwnerValidation = Joi.object({
    fullName: Joi.string(),
    birthDate: Joi.date().iso(),
    citizenship: Joi.string(),
    languagePriority: Joi.string().valid(...LangPriorities),
    hiredBy: Joi.string(),
    hireDate: Joi.date().iso(),
    snn: Joi.string(),
    company: Joi.string(),
    insurancePolicy: Joi.string(),
    insurancePolicyEFF: Joi.string(),
    insurancePolicyExp: Joi.date().iso(),
    address: Joi.string(),
    phone: Joi.string(),
    phone2: Joi.string(),
    email: Joi.string(),
    emergencyContactName: Joi.string(),
    emergencyContactRel: Joi.string(),
    emergencyContactPhone: Joi.string(),
    notes: Joi.string(),
});

