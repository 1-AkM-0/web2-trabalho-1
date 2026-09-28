const { itens } = require("../../data/itens")
const { PDFDocument } = require('pdfkit');

class PdfController {
  static pdfGet = async (req, res) => {
    const doc = new PDFDocument()

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'attachment; filename="lista.pdf"')

    doc.pipe(res)

    doc.fontSize(20).text("Relatório", { align: "center" })
    doc.moveDown();

    itens.forEach((item) => {
      doc.fontSize(12).text(`${item.nome}`)

      doc.moveDown()

    })

    doc.end()

  }

}

module.exports = PdfController
