const express = require("express");
const authController = require("../controllers/authController");

const userRouter = express.Router();

userRouter.route("/sign-up").post(authController.signup);
userRouter.route("/login").post(authController.login);

module.exports = userRouter;
