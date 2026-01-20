const validateSchema = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      details: error.details.map((err) => ({
        message: err.message,
        type: err.context.key,
      })),
    });
  }
  next();
};

module.exports = validateSchema;
