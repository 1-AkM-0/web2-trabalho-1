const mongoose = require("mongoose");
const Item = require("../models/Item");
const { enviarImagem, excluirImagem } = require("../config/cloudinary");

function idValido(id) {
  return mongoose.isValidObjectId(id);
}

class ItensController {
  static getItens = async (req, res, next) => {
    try {
      const todosOsItens = await Item.find();
      res.status(200).json({ itens: todosOsItens });
    } catch (erro) {
      next(erro);
    }
  };

  static inserirItem = async (req, res, next) => {
    try {
      const novoItemBody = req.body;

      if (!novoItemBody || Object.keys(novoItemBody).length === 0) {
        return res.status(400).json({
          mensagem: "Erro: Nenhum dado foi enviado na requisição.",
        });
      }

      const { nome } = novoItemBody;

      if (!nome || typeof nome !== "string" || !nome.trim()) {
        return res.status(400).json({
          mensagem: "Erro de validação: O item precisa de ter um 'nome'.",
        });
      }

      const novoItem = await Item.create({ nome: nome.trim() });

      return res.status(201).json({
        mensagem: "Item inserido com sucesso!",
        item: novoItem,
      });
    } catch (erro) {
      next(erro);
    }
  };

  static pesquisarPorCodigo = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!idValido(id)) {
        return res.status(400).json({ mensagem: "ID inválido." });
      }

      const itemEncontrado = await Item.findById(id);

      if (!itemEncontrado) {
        return res.status(404).json({ mensagem: "Item não encontrado." });
      }

      return res.status(200).json(itemEncontrado);
    } catch (erro) {
      next(erro);
    }
  };

  static excluirItem = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!idValido(id)) {
        return res.status(400).json({ mensagem: "ID inválido." });
      }

      const item = await Item.findById(id);

      if (!item) {
        return res
          .status(404)
          .json({ mensagem: "Item não encontrado para exclusão." });
      }

      if (item.imagemPublicId) {
        await excluirImagem(item.imagemPublicId);
      }

      await item.deleteOne();

      return res.status(200).json({ mensagem: "Item excluído com sucesso!" });
    } catch (erro) {
      next(erro);
    }
  };

  static enviarImagemItem = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!idValido(id)) {
        return res.status(400).json({ mensagem: "ID inválido." });
      }

      if (!req.file) {
        return res.status(400).json({
          mensagem: "Envie a imagem no campo 'imagem' (multipart/form-data).",
        });
      }

      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({ mensagem: "Item não encontrado." });
      }

      const { url, publicId } = await enviarImagem(req.file.buffer);

      if (item.imagemPublicId) {
        await excluirImagem(item.imagemPublicId);
      }

      item.imagemUrl = url;
      item.imagemPublicId = publicId;
      await item.save();

      return res.status(200).json({
        mensagem: "Imagem enviada com sucesso!",
        item,
      });
    } catch (erro) {
      next(erro);
    }
  };

  static excluirImagemItem = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!idValido(id)) {
        return res.status(400).json({ mensagem: "ID inválido." });
      }

      const item = await Item.findById(id);

      if (!item) {
        return res.status(404).json({ mensagem: "Item não encontrado." });
      }

      if (!item.imagemPublicId) {
        return res
          .status(404)
          .json({ mensagem: "Este item não possui imagem." });
      }

      await excluirImagem(item.imagemPublicId);

      item.imagemUrl = null;
      item.imagemPublicId = null;
      await item.save();

      return res.status(200).json({
        mensagem: "Imagem excluída com sucesso!",
        item,
      });
    } catch (erro) {
      next(erro);
    }
  };
}

module.exports = ItensController;
