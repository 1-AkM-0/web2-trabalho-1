const { itens } = require("../../data/itens")

class ItensController {
  static getItens = async (_, res) => {
    const todosOsItens = itens
    res.status(200).json({ itens: todosOsItens })
  }
    static inserirItem = async (req, res) => {
        const novoItem = req.body;
        itens.push(novoItem); 
        res.status(201).json({ mensagem: "Item inserido com sucesso!", item: novoItem });
    }

    static pesquisarPorCodigo = async (req, res) => {
        const idPesquisado = req.params.id; 
        const itemEncontrado = itens.find(item => item.id == idPesquisado);
        if (!itemEncontrado) {
            return res.status(404).json({ mensagem: "Item não encontrado." });
        }
        res.status(200).json(itemEncontrado);
    }

    static excluirItem = async (req, res) => {
        const idPesquisado = req.params.id; 
        const index = itens.findIndex(item => item.id == idPesquisado); 
        if (index === -1) {
            return res.status(404).json({ mensagem: "Item não encontrado para exclusão." });
        }
        itens.splice(index, 1);
        res.status(200).json({ mensagem: "Item excluído com sucesso!" });
    }
}

module.exports = ItensController 
