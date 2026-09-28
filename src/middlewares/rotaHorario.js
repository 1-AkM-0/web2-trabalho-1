const { logsRequisicoes } = require("../../data/requisicoes");

const horario = (req, res, next) => {
  const rota = req.baseUrl
  const hoj = new Date();
  const dataISO = hoj.toISOString().split('T')[0];
  logsRequisicoes.push({rota:rota, data:dataISO})


  next()
}

module.exports = {
    horario
}