const { Router } = require("express");
const pdfRouter = Router()
const PdfController = require("../controllers/pdfController");
const { horario } = require("../middlewares/rotaHorario");
const { pathExtractor } = require("../middlewares/logs");


pdfRouter.get("/", horario, pathExtractor, PdfController.pdfGet)


module.exports = pdfRouter 
