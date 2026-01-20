const bcrypt = require("bcrypt");
const UserModel = require("../models/UserModel");

const validateUserData =
  (options = {}) =>
  async (req, res, next) => {
    const { email, cpf, password } = req.body;
    const errors = [];

    if (options.checkEmail && email) {
      const emailExists = await UserModel.findByEmail(email);
      if (emailExists && (!req.user || emailExists.id !== req.user.id)) {
        errors.push({
          message: "E-mail already registered.",
          type: "email",
        });
      }
    }

    if (options.checkCpf && cpf) {
      const cpfExists = await UserModel.findByCpf(cpf);
      if (cpfExists && (!req.user || cpfExists.id !== req.user.id)) {
        errors.push({
          message: "CPF already registered.",
          type: "cpf",
        });
      }
    }

    if (options.checkEmailExists && email) {
      const user = await UserModel.findByEmail(email);
      if (!user) {
        errors.push({
          message: "Invalid email or password.",
          type: "email",
        });
      } else {
        req.user = user;
      }
    }

    if (options.checkIdExists && req.user && req.user.id) {
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        errors.push({
          message: "User not found.",
          type: "id",
        });
      } else {
        req.user = user;
      }
    }

    if (options.checkPassword && password) {
      const user = req.user;
      if (!user) {
        const message =
          req.path === "/login"
            ? "Invalid email or password."
            : "User not found.";
        errors.push({
          message,
          type: "password",
        });
      } else {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          const message =
            req.path === "/login"
              ? "Invalid email or password."
              : "Invalid current password.";
          errors.push({
            message,
            type: "password",
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ details: errors });
    }

    next();
  };

module.exports = validateUserData;
