import { Schema } from 'mongoose';

const oldValidator = Schema.Types.String.checkRequired;

Schema.Types.String.checkRequired = function (customValidator) {
  if (arguments.length !== 0) {
    return oldValidator.bind(this)(customValidator);
  }
  const validator = oldValidator.bind(this)();
  return function (value) {
    if (value === '') {
      return true;
    }
    return validator(value);
  };
};
