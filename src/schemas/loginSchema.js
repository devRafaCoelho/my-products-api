const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "The e-mail must be valid.",
    "any.required": "The e-mail is required.",
    "string.empty": "The e-mail is required.",
  }),
  password: Joi.string().min(5).required().messages({
    "any.required": "The password is required.",
    "string.empty": "The password is required.",
    "string.min": "The password must contain at least 5 characters.",
  }),
});

module.exports = loginSchema;
