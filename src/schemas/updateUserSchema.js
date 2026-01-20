const Joi = require("joi");
const { cpf: cpfValidator } = require("cpf-cnpj-validator");
const { isValidNumber } = require("libphonenumber-js");

const updateUserSchema = Joi.object({
  firstName: Joi.string().messages({
    "string.empty": "O primeiro nome não pode estar vazio.",
    "string.base": "O primeiro nome deve ser um nome válido.",
  }),
  lastName: Joi.string().messages({
    "string.empty": "O sobrenome não pode estar vazio.",
    "string.base": "O sobrenome deve ser um nome válido.",
  }),
  email: Joi.string().email().messages({
    "string.email": "O e-mail deve ser válido.",
    "string.empty": "O e-mail não pode estar vazio.",
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
      "any.invalid": "CPF inválido.",
      "string.pattern.base": "CPF inválido.",
      "string.length": "CPF inválido.",
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
      "any.invalid": "Número de telefone inválido.",
      "string.pattern.base": "Número de telefone inválido.",
      "string.length": "Número de telefone inválido.",
    }),
  password: Joi.string().min(5).messages({
    "string.empty": "A senha não pode estar vazia.",
    "string.min": "A senha deve conter pelo menos 5 caracteres.",
  }),
})
  .min(1)
  .messages({
    "object.min": "Pelo menos um campo deve ser fornecido para atualização.",
  });

module.exports = updateUserSchema;
