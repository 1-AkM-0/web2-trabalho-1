const mongoose = require("mongoose");

const globalCache = globalThis.__mongooseCache || {
  conn: null,
  promise: null,
};

globalThis.__mongooseCache = globalCache;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI não configurada. Defina a variável de ambiente com a string de conexão do MongoDB Atlas.",
    );
  }

  let dbName = process.env.MONGODB_DB || "web2-trabalho-1";

  try {
    const nomeNaUri = decodeURIComponent(
      new URL(uri).pathname.replace(/^\//, ""),
    );
    if (nomeNaUri) {
      dbName = nomeNaUri;
    }
  } catch {}

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
