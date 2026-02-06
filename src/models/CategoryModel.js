const db = require("../config/db");

class CategoryModel {
  constructor({ id, name, description }) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  static async findAll() {
    const query = `SELECT * FROM categories ORDER BY name ASC;`;
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `SELECT * FROM categories WHERE id = $1;`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByName(name) {
    const query = `SELECT * FROM categories WHERE name = $1;`;
    const result = await db.query(query, [name]);
    return result.rows[0];
  }
}

module.exports = CategoryModel;
