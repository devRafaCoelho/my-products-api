const Joi = require("joi");
const { cpf: cpfValidator } = require("cpf-cnpj-validator");
const { isValidNumber } = require("libphonenumber-js");

const userSchema = Joi.object({
  firstName: Joi.string().required().messages({
    "any.required": "The first name is required.",
    "string.empty": "The first name is required.",
    "string.base": "The first name must be a valid name.",
  }),
  lastName: Joi.string().required().messages({
    "any.required": "The last name is required.",
    "string.empty": "The last name is required.",
    "string.base": "The last name must be a valid name.",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "The e-mail must be valid.",
    "any.required": "The e-mail is required.",
    "string.empty": "The e-mail is required.",
  }),
  cpf: Joi.string()
    .custom((value, helpers) => {
      if (!cpfValidator.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .regex(/^\d{11}$/)
    .trim()
    .allow("")
    .messages({
      "any.invalid": "Invalid CPF.",
      "string.pattern.base": "Invalid CPF.",
      "string.length": "Invalid CPF.",
    }),
  phone: Joi.string()
    .custom((value, helpers) => {
      if (!isValidNumber(value, "BR")) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .regex(/^\+55\d{11}$/)
    .trim()
    .allow("")
    .messages({
      "any.invalid": "Invalid phone number.",
      "string.pattern.base": "Invalid phone number.",
      "string.length": "Invalid phone number.",
    }),
  password: Joi.string().min(5).required().messages({
    "any.required": "The password is required.",
    "string.empty": "The password is required.",
    "string.min": "The password must contain at least 5 characters.",
  }),
});

module.exports = userSchema;
