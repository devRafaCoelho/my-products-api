const Joi = require("joi");
const JoiDate = require("@joi/date");
const JoiExtended = Joi.extend(JoiDate);

const productSchema = JoiExtended.object({
  name: JoiExtended.string().required().messages({
    "any.required": "O nome do produto é obrigatório.",
    "string.empty": "O nome do produto é obrigatório.",
    "string.base": "O nome do produto deve ser um texto válido.",
  }),
  description: JoiExtended.string().allow("").messages({
    "string.base": "A descrição deve ser um texto válido.",
  }),
  price: JoiExtended.number().positive().required().messages({
    "any.required": "O preço é obrigatório.",
    "number.base": "O preço deve ser um número válido.",
    "number.positive": "O preço deve ser um valor positivo.",
  }),
  stock: JoiExtended.number().integer().min(0).required().messages({
    "any.required": "O estoque é obrigatório.",
    "number.base": "O estoque deve ser um número válido.",
    "number.integer": "O estoque deve ser um número inteiro.",
    "number.min": "O estoque não pode ser negativo.",
  }),
  expiration_date: JoiExtended.date()
    .format("YYYY-MM-DD")
    .allow(null, "")
    .messages({
      "date.format": "A data de validade deve estar no formato YYYY-MM-DD.",
      "date.base": "A data de validade deve ser uma data válida.",
    }),
});

module.exports = productSchema;
