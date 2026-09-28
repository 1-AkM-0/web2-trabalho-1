const { Router } = require("express");
const ItensController = require("../controllers/itensController");
const { pathExtractor } = require("../middlewares/logs");
const { horario } = require("../middlewares/rotaHorario");


const itensRouter = Router()

itensRouter.get("/", horario, pathExtractor, ItensController.getItens)
itensRouter.post("/", horario, pathExtractor, ItensController.inserirItem)
itensRouter.get("/:id", horario, pathExtractor, ItensController.pesquisarPorCodigo)
itensRouter.delete("/:id", horario, pathExtractor, ItensController.excluirItem)

module.exports = itensRouter 
