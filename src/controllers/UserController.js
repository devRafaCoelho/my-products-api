const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");
const transporter = require("../config/email");
const compilerHtml = require("../utils/compilerHtml");

class UserController {
  async createUser(req, res) {
    try {
      const userData = req.body;

      userData.password = await bcrypt.hash(userData.password, 10);

      const user = new UserModel(userData);
      const newUser = await user.create();

      const html = await compilerHtml("./src/templates/createUser.html", {
        firstName: userData.firstName,
      });

      await transporter.sendMail({
        from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_EMAIL}>`,
        to: `${userData.firstName} <${userData.email}>`,
        subject: "Welcome!!",
        html,
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error creating user");
    }
  }

  async login(req, res) {
    try {
      const user = req.user;

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "8h",
      });

      const { password: _, ...userData } = user;

      return res.status(200).json({ user: userData, token });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = UserController;
