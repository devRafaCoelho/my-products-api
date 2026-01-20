const ProductModel = require("../models/ProductModel");

const validateProductData =
  (options = {}) =>
  async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;
    const errors = [];

    if (options.checkProductExists && id) {
      const product = await ProductModel.findById(id, userId);
      if (!product) {
        errors.push({
          message: "Produto não encontrado.",
          type: "product",
        });
      } else {
        req.product = product;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ details: errors });
    }

    next();
  };

module.exports = validateProductData;
