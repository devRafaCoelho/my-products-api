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

  static async findAll(id_user, page = 1, limit = 10, filters = {}) {
    const { expiration_date, category, search } = filters;

    // Construir a query dinamicamente
    let conditions = ["id_user = $1"];
    let values = [id_user];
    let paramCount = 1;

    // Filtro por data de validade
    if (expiration_date) {
      paramCount++;
      conditions.push(`expiration_date = $${paramCount}`);
      values.push(expiration_date);
    }

    // Filtro por categoria
    if (category) {
      paramCount++;
      conditions.push(`category ILIKE $${paramCount}`);
      values.push(category);
    }

    // Filtro de busca por nome
    if (search) {
      paramCount++;
      conditions.push(`name ILIKE $${paramCount}`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.join(" AND ");

    // Query para contar o total de registros
    const countQuery = `SELECT COUNT(*) FROM products WHERE ${whereClause};`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Calcular offset
    const offset = (page - 1) * limit;

    // Query para buscar os produtos com paginação
    const query = `
      SELECT * FROM products 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2};
    `;

    const result = await db.query(query, [...values, limit, offset]);

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
