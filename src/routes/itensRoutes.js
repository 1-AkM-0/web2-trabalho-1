const { Router } = require("express");
const ItensController = require("../controllers/itensController");

const itensRouter = Router()

itensRouter.get("/", ItensController.getItens)
itensRouter.post("/", ItensController.inserirItem)
itensRouter.get("/:id", ItensController.pesquisarPorCodigo)
itensRouter.delete("/:id", ItensController.excluirItem)

module.exports = itensRouter 
