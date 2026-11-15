require("dotenv").config();

const mongoose = require("mongoose");

async function main() {
  const dbName = process.env.MONGODB_DB || "web2-trabalho-1";

  await mongoose.connect(process.env.MONGODB_URI, {
    dbName,
    serverSelectionTimeoutMS: 10000,
  });

  const db = mongoose.connection.db;

  console.log("MongoDB conectado com sucesso.");
  console.log("Host:", mongoose.connection.host);
  console.log("Banco:", mongoose.connection.name);

  const colecoes = await db.listCollections().toArray();

  if (colecoes.length === 0) {
    console.log("Nenhuma coleção encontrada. Rode `npm run seed` para popular.");
    return;
  }

  for (const colecao of colecoes.sort((a, b) => a.name.localeCompare(b.name))) {
    const total = await db.collection(colecao.name).countDocuments();
    console.log(`- ${colecao.name}: ${total} documento(s)`);
  }

  const itens = await db
    .collection("items")
    .find({}, { projection: { nome: 1, imagemUrl: 1 } })
    .limit(5)
    .toArray();

  if (itens.length > 0) {
    console.log("\nPrimeiros itens:");
    itens.forEach((item) => {
      console.log(`- ${item.nome}${item.imagemUrl ? " (com imagem)" : ""}`);
    });
  }

  const hoje = new Date().toISOString().split("T")[0];
  const logsHoje = await db.collection("logs").countDocuments({ data: hoje });
  console.log(`\nLogs de hoje (${hoje}): ${logsHoje}`);
}

main()
  .catch((erro) => {
    console.error("Falha ao conectar/consultar o MongoDB:", erro.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
