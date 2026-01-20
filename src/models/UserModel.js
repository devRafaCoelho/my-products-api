const db = require("../config/db");

class UserModel {
  constructor({ id, firstName, lastName, email, cpf, phone, password }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.cpf = cpf;
    this.phone = phone;
    this.password = password;
  }

  async create() {
    const query = `
            INSERT INTO users (firstName, lastName, email, cpf, phone, password)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
    const values = [
      this.firstName,
      this.lastName,
      this.email,
      this.cpf,
      this.phone,
      this.password,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findAll() {
    const query = `SELECT * FROM users;`;
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = `SELECT * FROM users WHERE id = $1;`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1;`;
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findByCpf(cpf) {
    const query = `SELECT * FROM users WHERE cpf = $1;`;
    const result = await db.query(query, [cpf]);
    return result.rows[0];
  }

  static async update(id, updatedData) {
    const fields = Object.keys(updatedData)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ");
    const values = [id, ...Object.values(updatedData)];

    const query = `
      UPDATE users
      SET ${fields}
      WHERE id = $1
      RETURNING *;
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async newPassword(id, newPassword) {
    const query = `
      UPDATE users
      SET password = $2
      WHERE id = $1
      RETURNING *;
    `;
    const values = [id, newPassword];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const queryRecord = `DELETE FROM records WHERE id_user = $1 RETURNING *;`;
    await db.query(queryRecord, [id]);

    const query = `DELETE FROM users WHERE id = $1 RETURNING *;`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = UserModel;
