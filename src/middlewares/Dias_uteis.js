// Array para armazenar o histórico de requisições realizadas nos dias úteis
const logsRequisicoes = [];

/**
 * REQUISITO E: Middleware que permite o acesso à API apenas de segunda a sexta-feira.
 */
function middlewareAcessoDiasUteis(req, res, next) {
  const hoje = new Date();
  const diaDaSemana = hoje.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

  // 0 (Domingo) e 6 (Sábado) -> Acesso proibido
  if (diaDaSemana === 0 || diaDaSemana === 6) {
    return res.status(403).json({
      erro: "Acesso proibido. A API funciona apenas de segunda a sexta-feira."
    });
  }

  // Se o acesso for permitido, registra o log da requisição
  const dataFormatada = hoje.toISOString().split("T")[0]; // YYYY-MM-DD
  const horaFormatada = hoje.toTimeString().split(" ")[0]; // HH:MM:SS

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