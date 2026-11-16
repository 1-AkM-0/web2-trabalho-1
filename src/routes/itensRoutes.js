const { Router } = require("express");
const ItensController = require("../controllers/itensController");
const CsvController = require("../controllers/csvController");
const { pathExtractor } = require("../middlewares/logs");
const { horario } = require("../middlewares/rotaHorario");
const { upload } = require("../middlewares/upload");

const itensRouter = Router();

itensRouter.get("/exportar", horario, pathExtractor, CsvController.exportarItens);
itensRouter.get("/", horario, pathExtractor, ItensController.getItens);
itensRouter.post("/", horario, pathExtractor, ItensController.inserirItem);
itensRouter.get("/:id", horario, pathExtractor, ItensController.pesquisarPorCodigo);
itensRouter.delete("/:id", horario, pathExtractor, ItensController.excluirItem);

// Item B: upload/remoção da imagem do item no Cloudinary.
itensRouter.post(
  "/:id/imagem",
  horario,
  pathExtractor,
  upload.single("imagem"),
  ItensController.enviarImagemItem
);
itensRouter.delete(
  "/:id/imagem",
  horario,
  pathExtractor,
  ItensController.excluirImagemItem
);

module.exports = itensRouter;
