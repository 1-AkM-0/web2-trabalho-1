const crypto = require("node:crypto");

const gerarToken = (usuarioId) => {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) throw new Error("JWT_SECRET não configurado.");

  const cabecalho = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const agora = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub: String(usuarioId), iat: agora, exp: agora + 60 * 60 })
  ).toString("base64url");

  const dados = `${cabecalho}.${payload}`;
  const assinatura = crypto.createHmac("sha256", segredo).update(dados).digest("base64url");
  return `${dados}.${assinatura}`;
};

const verificarToken = (token) => {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) return null;

  const partes = token.split(".");
  if (partes.length !== 3) return null;

  let header;
  try {
    header = JSON.parse(Buffer.from(partes[0], "base64url").toString());
  } catch {
    return null;
  }
  if (!header || header.alg !== "HS256" || header.typ !== "JWT") return null;

  const dados = `${partes[0]}.${partes[1]}`;
  const esperada = crypto.createHmac("sha256", segredo).update(dados).digest();

  let recebida;
  try {
    recebida = Buffer.from(partes[2], "base64url");
  } catch {
    return null;
  }

  if (recebida.length !== esperada.length || !crypto.timingSafeEqual(recebida, esperada)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(partes[1], "base64url").toString());
    if (!payload.sub || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

module.exports = { gerarToken, verificarToken };