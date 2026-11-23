const multer = require("multer");

const TAMANHO_MAXIMO = 4 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANHO_MAXIMO },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      const erro = new Error("Envie apenas arquivos de imagem.");
      erro.status = 400;
      return callback(erro);
    }

    return callback(null, true);
  },
});

module.exports = { upload, TAMANHO_MAXIMO };
