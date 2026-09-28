const express = require("express")
const itensRoutes = require("./routes/itensRoutes")
const pdfRoutes = require("./routes/pdfRoutes")
const logsRoutes = require("./routes/requisicaoGet")

const app = express()

app.use(express.json());
app.use("/api/itens", itensRoutes)
app.use("/api/pdf", pdfRoutes)
app.use("/api/logs", logsRoutes)


const startServer = () => {
  app.listen(3000, () => {
    console.log("API rodando na porta 3000")
  })
}

module.exports = { startServer }
