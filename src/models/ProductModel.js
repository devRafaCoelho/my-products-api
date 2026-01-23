const db = require("../config/db");

class ProductModel {
  constructor({
    id,
    name,
    description,
    price,
    stock,
    expiration_date,
    category,
    id_user,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.stock = stock;
    this.expiration_date = expiration_date;
    this.category = category;
    this.id_user = id_user;
  }

  async create() {
    const query = `
      INSERT INTO products (name, description, price, stock, expiration_date, category, id_user)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      this.name,
      this.description,
      this.price,
      this.stock,
      this.expiration_date,
      this.category,
      this.id_user,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll(id_user) {
    const query = `SELECT * FROM products WHERE id_user = $1 ORDER BY created_at DESC;`;
    const result = await db.query(query, [id_user]);
    return result.rows;
  }

  static async findById(id, id_user) {
    const query = `SELECT * FROM products WHERE id = $1 AND id_user = $2;`;
    const result = await db.query(query, [id, id_user]);
    return result.rows[0];
  }

  static async update(id, id_user, updatedData) {
    const fields = Object.keys(updatedData)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(", ");
    const values = [id, id_user, ...Object.values(updatedData)];

    const query = `
      UPDATE products
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND id_user = $2
      RETURNING *;
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id, id_user) {
    const query = `DELETE FROM products WHERE id = $1 AND id_user = $2 RETURNING *;`;
    const result = await db.query(query, [id, id_user]);
    return result.rows[0];
  }
}

module.exports = ProductModel;
