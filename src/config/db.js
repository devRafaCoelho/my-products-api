const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DB_CONNECTION_STRING,
});

pool.on("connect", () => {
  console.log("Connected to the PostgreSQL database");
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
  pool,
};
