const mongoose = require("mongoose");

// Na Vercel cada requisição pode cair em uma instância diferente. Guardamos a
// conexão (e a promise em andamento) no escopo global para reaproveitá-la entre
// invocações e evitar abrir várias conexões com o Atlas.
const globalCache = globalThis.__mongooseCache || {
  conn: null,
  promise: null,
};

globalThis.__mongooseCache = globalCache;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI não configurada. Defina a variável de ambiente com a string de conexão do MongoDB Atlas."
    );
  }

  // Se a URI não informar o banco, usa MONGODB_DB ou o padrão do projeto.
  // Assim evitamos cair no banco "test" do MongoDB.
  let dbName = process.env.MONGODB_DB || "web2-trabalho-1";

  try {
    const nomeNaUri = decodeURIComponent(new URL(uri).pathname.replace(/^\//, ""));
    if (nomeNaUri) {
      dbName = nomeNaUri;
    }
  } catch {
    // URI em formato inesperado: mantém o banco padrão.
  }

  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(uri, {
      dbName,
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    globalCache.conn = await globalCache.promise;
    return globalCache.conn;
  } catch (erro) {
    globalCache.promise = null;
    throw erro;
  }
}

async function disconnectDB() {
  if (!globalCache.conn) {
    return;
  }

  await mongoose.disconnect();
  globalCache.conn = null;
  globalCache.promise = null;
}

module.exports = { connectDB, disconnectDB };
