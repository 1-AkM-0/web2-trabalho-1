const Log = require("../models/Log");

const horario = (req, res, next) => {
  const rota = req.baseUrl || req.path;
  const data = new Date().toISOString().split("T")[0];

  // O log não deve derrubar a requisição principal caso o banco falhe.
  Log.create({ rota, data }).catch((erro) => {
    console.error("Não foi possível registrar o log da requisição:", erro.message);
  });

  next();
};

module.exports = {
  horario,
};
