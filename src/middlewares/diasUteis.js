function middlewareAcessoDiasUteis(req, res, next) {
  const hoje = new Date();
  const diaDaSemana = hoje.getDay(); 

  if (diaDaSemana === 0 || diaDaSemana === 6) {
    return res.status(403).json({
      erro: "Acesso proibido. A API funciona apenas de segunda a sexta-feira."
    });
  }

  next();
}

module.exports = {
  middlewareAcessoDiasUteis,
};