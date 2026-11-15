const pathExtractor = (req, res, next) => {
  const rota = req.baseUrl
  const horario = new Date().toLocaleString("pt-BR")

  if (process.env.NODE_ENV !== "test") {
    console.log(`${rota} ${horario}`);
  }

  next()

}

module.exports = { pathExtractor }
