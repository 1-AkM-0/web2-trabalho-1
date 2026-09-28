const express = require("express")
const itensRoutes = require("./routes/itensRoutes")
const pdfRoutes = require("./routes/pdfRoutes")
const logsRoutes = require("./routes/requisicaoGet")

const app = express()

app.use(express.json());
app.use("/api/itens", itensRoutes)
app.use("/api/pdf", pdfRoutes)
app.use("/api/logs", logsRoutes)

app.get("/", (_, res) => {
  res.json({ status: "ok", mensagem: "API rodando. Use /api/itens, /api/pdf, /api/logs" })
})


const startServer = () => {
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`API rodando na porta ${port}`)
  })
}

module.exports = app
module.exports.startServer = startServer
