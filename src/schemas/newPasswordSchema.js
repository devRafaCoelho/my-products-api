const Joi = require("joi");

const newPasswordSchema = Joi.object({
  password: Joi.string().min(5).required().messages({
    "any.required": "A senha é obrigatória.",
    "string.empty": "A senha é obrigatória.",
    "string.min": "A senha deve conter pelo menos 5 caracteres.",
  }),
  newPassword: Joi.string().min(5).required().messages({
    "any.required": "A nova senha é obrigatória.",
    "string.empty": "A nova senha é obrigatória.",
    "string.min": "A nova senha deve conter pelo menos 5 caracteres.",
  }),
  confirmNewPassword: Joi.any()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "As senhas não correspondem.",
      "any.required": "A confirmação da nova senha é obrigatória.",
      "any.empty": "A confirmação da nova senha é obrigatória.",
    }),
});

module.exports = newPasswordSchema;
