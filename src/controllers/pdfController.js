const { PDFDocument } = require("pdfkit");
const Item = require("../models/Item");

class PdfController {
  static pdfGet = async (req, res, next) => {
    try {
      const itens = await Item.find();
      const doc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="lista.pdf"');

      doc.pipe(res);

      doc.fontSize(20).text("Relatório", { align: "center" });
      doc.moveDown();

      itens.forEach((item) => {
        doc.fontSize(12).text(item.nome);
        doc.moveDown();
      });

      doc.end();
    } catch (erro) {
      next(erro);
    }
  };
}

module.exports = PdfController;
