const { verificarToken } = require("../utils/authToken");

module.exports = (req, res, next) => {
  const cabecalho = req.get("authorization") || "";
  const [tipo, token] = cabecalho.split(" ");
  const payload = tipo === "Bearer" && token ? verificarToken(token) : null;

  if (!payload) {
    return res.status(401).json({ mensagem: "Autenticação necessária." });
  }

  req.usuarioId = payload.sub;
  return next();
};