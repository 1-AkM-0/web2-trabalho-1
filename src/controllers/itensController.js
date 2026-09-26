const { itens } = require("../../data/itens")

class ItensController {
  static getItens = async (_, res) => {
    const todosOsItens = itens
    res.status(200).json({ itens: todosOsItens })
  }
}

module.exports = ItensController 
