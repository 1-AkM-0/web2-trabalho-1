const { Router } = require("express");
const AuthController = require("../controllers/authController");

const authRouter = Router();

authRouter.post("/registrar", AuthController.registrar);
authRouter.post("/login", AuthController.login);
authRouter.post("/verificar-2fa", AuthController.verificar2FA);

module.exports = authRouter;
