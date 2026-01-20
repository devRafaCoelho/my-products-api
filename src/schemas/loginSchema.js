const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "O e-mail deve ser válido.",
    "any.required": "O e-mail é obrigatório.",
    "string.empty": "O e-mail é obrigatório.",
  }),
  password: Joi.string().min(5).required().messages({
    "any.required": "A senha é obrigatória.",
    "string.empty": "A senha é obrigatória.",
    "string.min": "A senha deve conter pelo menos 5 caracteres.",
  }),
});

module.exports = loginSchema;
