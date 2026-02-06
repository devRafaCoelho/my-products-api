const express = require("express");
const NfceController = require("../controllers/NfceController");
const validateAuthentication = require("../middlewares/validateAuthentication");

const setNfceRoutes = (app) => {
  const router = express.Router();
  const nfceController = new NfceController();

  router.use(validateAuthentication);

  router.post("/nfce/consult", nfceController.consult.bind(nfceController));

  app.use("/api", router);
};

module.exports = setNfceRoutes;
