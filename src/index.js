const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const setUserRoutes = require("./routes/userRoutes");
const setProductRoutes = require("./routes/productRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

setUserRoutes(app);
setProductRoutes(app);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
