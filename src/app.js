const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const itensRoutes = require("./routes/itensRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const logsRoutes = require("./routes/requisicaoGet");
const authRoutes = require("./routes/authRoutes");
const autenticar = require("./middlewares/autenticar");
const { connectDB } = require("./config/db");

const paginaExportar = fs.readFileSync(
  path.join(__dirname, "views", "exportar.html"),
  "utf8"
);

const app = express();

app.disable("x-powered-by");

app.use((req, res, next) => {
  const origem = req.get("origin");

  if (!origem) {
    return next();
  }

  res.vary("Origin");

  try {
    const protocoloEncaminhado = req.get("x-forwarded-proto");
    const protocolo = (protocoloEncaminhado || req.protocol).split(",")[0].trim();
    const host = req.get("host");
    const origemEsperada = new URL(`${protocolo}://${host}`).origin;

    if (new URL(origem).origin !== origemEsperada) {
      return res.status(403).json({ mensagem: "Origem não permitida." });
    }
  } catch {
    return res.status(403).json({ mensagem: "Origem não permitida." });
  }

  res.setHeader("Access-Control-Allow-Origin", origem);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());

app.get("/exportar", (_, res) => {
  res.type("html").send(paginaExportar);
});

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
app.use("/api/itens", autenticar, itensRoutes);
app.use("/api/pdf", autenticar, pdfRoutes);
app.use("/api/logs", autenticar, logsRoutes);
app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ mensagem: "Rota não encontrada." });
});

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