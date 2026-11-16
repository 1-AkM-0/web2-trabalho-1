const Item = require("../models/Item");

function protegerFormula(valor) {
  const texto = valor == null ? "" : String(valor);

  return /^[\u0000-\u0020]*[=+\-@]/.test(texto) ? `'${texto}` : texto;
}

function escaparCampoCSV(valor) {
  return `"${protegerFormula(valor).replace(/"/g, '""')}"`;
}

function dataISO(valor) {
  if (!valor) return "";
  return valor instanceof Date ? valor.toISOString() : valor;
}

class CsvController {
  static exportarItens = async (req, res, next) => {
    try {
      const itens = await Item.find();
      const colunas = ["id", "nome", "imagemUrl", "criadoEm", "atualizadoEm"];
      const linhas = [colunas.map(escaparCampoCSV).join(",")];

      for (const item of itens) {
        const linha = [
          item.id || item._id?.toString?.() || "",
          item.nome,
          item.imagemUrl,
          dataISO(item.createdAt),
          dataISO(item.updatedAt),
        ];

        linhas.push(linha.map(escaparCampoCSV).join(","));
      }

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="itens.csv"');
      return res.status(200).send(`\uFEFF${linhas.join("\r\n")}\r\n`);
    } catch (erro) {
      return next(erro);
    }
  };
}

module.exports = CsvController;
