const { itens } = require("../../data/itens")

class ItensController {
    static getItens = async (_, res) => {
        const todosOsItens = itens
        res.status(200).json({ itens: todosOsItens })
    }
    static inserirItem = async (req, res) => {
        const novoItemBody = req.body;
        if (!novoItemBody || Object.keys(novoItemBody).length === 0) {
            return res.status(400).json({
                mensagem: "Erro: Nenhum dado foi enviado na requisição."
            });
        }
        const { nome } = novoItemBody;
        if (!nome) {
            return res.status(400).json({
                mensagem: "Erro de validação: O item precisa de ter um 'nome'."
            });
        }
        const maiorId = itens.length > 0 ? Math.max(...itens.map(item => item.id)) : 0;
        const novoId = maiorId + 1;
        const novoItem = {
            id: novoId,
            nome: nome
        };
        itens.push(novoItem);
        res.status(201).json({
            mensagem: "Item inserido com sucesso!",
            item: novoItem
        });
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