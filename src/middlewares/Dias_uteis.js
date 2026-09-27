const logsRequisicoes = [];


function middlewareAcessoDiasUteis(req, res, next) {
  const hoje = new Date();
  const diaDaSemana = hoje.getDay(); 

  if (diaDaSemana === 0 || diaDaSemana === 6) {
    return res.status(403).json({
      erro: "Acesso proibido. A API funciona apenas de segunda a sexta-feira."
    });
  }

  const dataFormatada = hoje.toISOString().split("T")[0]; 
  const horaFormatada = hoje.toTimeString().split(" ")[0]; 

  logsRequisicoes.push({
    data: dataFormatada,
    horario: horaFormatada,
    metodo: req.method,
    rota: req.originalUrl
  });

  next();
}

module.exports = {
  middlewareAcessoDiasUteis,
  logsRequisicoes
};