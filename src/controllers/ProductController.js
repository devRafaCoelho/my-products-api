const ProductModel = require("../models/ProductModel");

class ProductController {
  async createProduct(req, res) {
    try {
      const data = req.body;
      const userId = req.user.id;

      // Verifica se é um array de produtos
      if (Array.isArray(data)) {
        // Processa todos os produtos em paralelo para melhor performance
        const productPromises = data.map((productData) => {
          productData.id_user = userId;
          const product = new ProductModel(productData);
          return product.create();
        });

        const createdProducts = await Promise.all(productPromises);
        return res.status(201).json(createdProducts);
      }

      // Caso seja um único produto
      data.id_user = userId;
      const product = new ProductModel(data);
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
      const {
        page = 1,
        limit = 10,
        expiration_date,
        id_category,
        search,
      } = req.query;

      // Converte para números
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      // Validação básica
      if (pageNum < 1 || limitNum < 1) {
        return res.status(400).json({
          message: "Parâmetros de paginação inválidos",
        });
      }

      const filters = {
        expiration_date,
        id_category,
        search,
      };

      const result = await ProductModel.findAll(id, pageNum, limitNum, filters);

      res.status(200).json(result);
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
