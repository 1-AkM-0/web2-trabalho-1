require("dotenv").config();

const app = require("./app");

if (require.main === module) {
  app.startServer().catch((erro) => {
    console.error("Não foi possível iniciar a API:", erro.message);
    process.exit(1);
  });
}

module.exports = app;
