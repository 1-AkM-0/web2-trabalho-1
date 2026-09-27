const { Router } = require("express");
const ItensController = require("../controllers/itensController");
const { pathExtractor } = require("../middlewares/logs");

const itensRouter = Router()

itensRouter.get("/", pathExtractor, ItensController.getItens)
itensRouter.post("/", pathExtractor, ItensController.inserirItem)
itensRouter.get("/:id", pathExtractor, ItensController.pesquisarPorCodigo)
itensRouter.delete("/:id", pathExtractor, ItensController.excluirItem)

module.exports = itensRouter 
