const {Router} = require("express");
const { logsRequisicoes } = require("../../data/requisicoes");
const { horario } = require("../middlewares/rotaHorario");
const { pathExtractor } = require("../middlewares/logs");
const router = Router()


router.get("/", horario, pathExtractor, (req, res) => {
  const { data } = req.query;

  if (!data) {
    return res.status(400).json({
      erro: "Informe a data no parâmetro query. Exemplo: /logs?data=YYYY-MM-DD"
    });
  }

  const logsFiltrados = logsRequisicoes.filter(log => log.data === data);

  return res.json({
    total: logsFiltrados.length,
    dataConsultada: data,
    logs: logsFiltrados
  });
});

module.exports = router;