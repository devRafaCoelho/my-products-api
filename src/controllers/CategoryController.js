const CategoryModel = require("../models/CategoryModel");

class CategoryController {
  async getAllCategories(req, res) {
    try {
      const categories = await CategoryModel.findAll();
      res.status(200).json(categories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  }

  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await CategoryModel.findById(id);

      if (!category) {
        return res.status(404).json({ message: "Categoria não encontrada" });
      }

      res.status(200).json(category);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar categoria" });
    }
  }
}

module.exports = CategoryController;
