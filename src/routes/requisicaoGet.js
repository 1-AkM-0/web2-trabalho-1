const { Router } = require("express");
const Log = require("../models/Log");
const { horario } = require("../middlewares/rotaHorario");
const { pathExtractor } = require("../middlewares/logs");

const router = Router();

router.get("/", horario, pathExtractor, async (req, res, next) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({
        erro: "Informe a data no parâmetro query. Exemplo: /logs?data=YYYY-MM-DD",
      });
    }

    const logsFiltrados = await Log.find({ data });

    return res.json({
      total: logsFiltrados.length,
      dataConsultada: data,
      logs: logsFiltrados,
    });
  } catch (erro) {
    return next(erro);
  }
});

module.exports = router;
