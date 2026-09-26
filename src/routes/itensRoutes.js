const { Router } = require("express");
const ItensController = require("../controllers/itensController");

const itensRouter = Router()

itensRouter.get("/", ItensController.getItens)

module.exports = itensRouter 
