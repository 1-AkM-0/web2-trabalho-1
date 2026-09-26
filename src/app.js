const express = require("express")
const itensRoutes = require("./routes/itensRoutes")

const app = express()

app.use("/api/itens", itensRoutes)


const startServer = () => {
  app.listen(3000, () => {
    console.log("API rodando na porta 3000")
  })
}

module.exports = { startServer }
