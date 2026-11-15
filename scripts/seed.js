require("dotenv").config();

const { connectDB, disconnectDB } = require("../src/config/db");
const Item = require("../src/models/Item");
const { itens } = require("../data/itens");

async function seed() {
  await connectDB();

  const quantidade = await Item.countDocuments();

  if (quantidade > 0) {
    console.log(`O banco já possui ${quantidade} item(ns). Nada foi inserido.`);
    return;
  }

  const inseridos = await Item.insertMany(itens.map(({ nome }) => ({ nome })));
  console.log(`${inseridos.length} itens inseridos com sucesso.`);
}

seed()
  .catch((erro) => {
    console.error("Falha ao popular o banco:", erro.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
