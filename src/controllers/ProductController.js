const ProductModel = require("../models/ProductModel");

class ProductController {
  async createProduct(req, res) {
    try {
      const productData = req.body;
      productData.id_user = req.user.id;

      const product = new ProductModel(productData);
      const newProduct = await product.create();

      res.status(201).json(newProduct);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao criar produto" });
    }
  }

  async getAllProducts(req, res) {
    try {
      const { id } = req.user;
      const products = await ProductModel.findAll(id);

      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  }

  async getProductById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const product = await ProductModel.findById(id, userId);

      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar produto" });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const data = req.body;

      const updatedProduct = await ProductModel.update(id, userId, data);

      if (!updatedProduct) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      return res.status(200).json(updatedProduct);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao atualizar produto" });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deletedProduct = await ProductModel.delete(id, userId);

      if (!deletedProduct) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro ao deletar produto" });
    }
  }
}

module.exports = ProductController;
