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

      // Envia email de forma assíncrona sem bloquear a resposta
      compilerHtml("./src/templates/createUser.html", {
        firstName: userData.firstName,
      })
        .then((html) => {
          return transporter.sendMail({
            from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_EMAIL}>`,
            to: `${userData.firstName} <${userData.email}>`,
            subject: "Welcome!!",
            html,
          });
        })
        .catch((error) => {
          console.error("Error sending welcome email:", error);
        });

      // Responde imediatamente após criar o usuário
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

  async getUserByLogin(req, res) {
    try {
      const user = req.user;

      const { password: _, ...userData } = user;

      res.status(200).json(userData);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving user");
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.user;
      const data = req.body;

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }

      const updatedUser = await UserModel.update(id, data);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userData } = updatedUser;

      return res.status(200).json(userData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async updateUserPassword(req, res) {
    try {
      const { id } = req.user;
      const { newPassword } = req.body;

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = await UserModel.newPassword(id, hashedPassword);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found." });
      }

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.user;
      const deletedUser = await UserModel.delete(id);

      if (!deletedUser) {
        return res.status(404).send("User not found");
      }

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = UserController;
