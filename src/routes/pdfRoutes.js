const { Router } = require("express");
const pdfRouter = Router()
const PdfController = require("../controllers/pdfController");


pdfRouter.get("/", PdfController.pdfGet)


module.exports = pdfRouter 
