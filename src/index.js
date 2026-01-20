const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// setUserRoutes(app);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
