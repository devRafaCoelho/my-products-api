const express = require("express");
const CategoryController = require("../controllers/CategoryController");
const validateAuthentication = require("../middlewares/validateAuthentication");

const setCategoryRoutes = (app) => {
  const router = express.Router();
  const categoryController = new CategoryController();

  router.use(validateAuthentication);

  router.get(
    "/categories",
    categoryController.getAllCategories.bind(categoryController),
  );

  router.get(
    "/categories/:id",
    categoryController.getCategoryById.bind(categoryController),
  );

  app.use("/api", router);
};

module.exports = setCategoryRoutes;
