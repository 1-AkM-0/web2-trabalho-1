const express = require("express");
const router = express.Router();
const { logsRequisicoes } = require("../middlewares/acessoDiasUteis");

router.get("/logs", (req, res) => {
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