const express = require("express")


const app = express()


const startServer = () => {
  app.listen(3000, () => {
    console.log("API rodando na porta 3000")
  })
}

module.exports = { startServer }
