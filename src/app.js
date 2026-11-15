const express = require("express");
const itensRoutes = require("./routes/itensRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const logsRoutes = require("./routes/requisicaoGet");
const { connectDB } = require("./config/db");

const app = express();

app.disable("x-powered-by");
app.use(express.json());

// Garante a conexão com o MongoDB antes de qualquer rota /api. Em serverless a
// conexão é reaproveitada pelo cache global em config/db.js.
const garantirConexao = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (erro) {
    next(erro);
  }
};

app.get("/", (_, res) => {
  res.json({ status: "ok", mensagem: "API rodando. Use /api/itens, /api/pdf, /api/logs" });
});

app.use("/api", garantirConexao);
app.use("/api/itens", itensRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/logs", logsRoutes);

app.use((req, res) => {
  res.status(404).json({ mensagem: "Rota não encontrada." });
});

// eslint-disable-next-line no-unused-vars
app.use((erro, req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.error(erro);
  }

  if (erro.name === "MulterError") {
    const mensagem =
      erro.code === "LIMIT_FILE_SIZE"
        ? "A imagem deve ter no máximo 4 MB."
        : `Erro no upload: ${erro.message}`;
    return res.status(400).json({ mensagem });
  }

  const status = erro.status || erro.statusCode || 500;

  return res.status(status).json({
    mensagem: status >= 500 ? "Erro interno do servidor." : erro.message,
  });
});

const startServer = async () => {
  await connectDB();

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
  });
};

module.exports = app;
module.exports.startServer = startServer;
