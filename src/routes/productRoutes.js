const express = require("express");
const ProductController = require("../controllers/ProductController");
const validateSchema = require("../middlewares/validateSchema");
const validateProductData = require("../middlewares/validateProductData");
const validateAuthentication = require("../middlewares/validateAuthentication");
const productSchema = require("../schemas/productSchema");
const updateProductSchema = require("../schemas/updateProductSchema");

const setProductRoutes = (app) => {
  const router = express.Router();
  const productController = new ProductController();

  router.use(validateAuthentication);

  router.post(
    "/products",
    validateSchema(productSchema),
    productController.createProduct.bind(productController),
  );

  router.get(
    "/products",
    productController.getAllProducts.bind(productController),
  );

  router.get(
    "/products/:id",
    validateProductData({ checkProductExists: true }),
    productController.getProductById.bind(productController),
  );

  router.put(
    "/products/:id",
    validateSchema(updateProductSchema),
    validateProductData({ checkProductExists: true }),
    productController.updateProduct.bind(productController),
  );

  router.delete(
    "/products/:id",
    validateProductData({ checkProductExists: true }),
    productController.deleteProduct.bind(productController),
  );

  app.use("/api", router);
};

module.exports = setProductRoutes;
