const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const validateAuthentication = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ message: "Unauthorized!" });
  }

  const token = authorization.substring(7).trim();

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const loggedUser = await UserModel.findById(id);
    if (!loggedUser) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    const { password: _, ...userData } = loggedUser;
    req.user = userData;

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Unauthorized!" });
  }
};

module.exports = validateAuthentication;
