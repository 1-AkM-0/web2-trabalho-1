const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const Usuario = require("../models/Usuario");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class AuthController {
  static registrar = async (req, res) => {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: "Nome, email e senha são obrigatórios." });
      }

      const usuarioExistente = await Usuario.findOne({ email });
      if (usuarioExistente) {
        return res.status(400).json({ mensagem: "Este email já está cadastrado." });
      }

      const novoUsuario = await Usuario.create({ nome, email, senha });

      return res.status(201).json({
        mensagem: "Usuário cadastrado com sucesso!",
        usuario: {
          id: novoUsuario._id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
        },
      });
    } catch (erro) {
      return res.status(500).json({ mensagem: "Erro ao registrar usuário.", erro: erro.message });
    }
  };

  static login = async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ mensagem: "Email e senha são obrigatórios." });
      }

      const usuario = await Usuario.findOne({ email });
      if (!usuario) {
        return res.status(401).json({ mensagem: "Credenciais inválidas." });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ mensagem: "Credenciais inválidas." });
      }

      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      usuario.codigo2FA = codigo;
      usuario.expiracaoCodigo2FA = new Date(Date.now() + 10 * 60 * 1000);
      await usuario.save();

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: usuario.email,
          subject: "Código de Verificação (2FA)",
          text: `Seu código de acesso é: ${codigo}. Ele expira em 10 minutos.`,
        });
      }

      return res.status(200).json({
        mensagem: "Código de verificação enviado para o seu email.",
      });
    } catch (erro) {
      return res.status(500).json({ mensagem: "Erro ao realizar login.", erro: erro.message });
    }
  };

  static verificar2FA = async (req, res) => {
    try {
      const { email, codigo } = req.body;

      if (!email || !codigo) {
        return res.status(400).json({ mensagem: "Email e código são obrigatórios." });
      }

      const usuario = await Usuario.findOne({ email });
      if (!usuario || !usuario.codigo2FA) {
        return res.status(400).json({ mensagem: "Solicitação de código inválida." });
      }

      if (new Date() > usuario.expiracaoCodigo2FA) {
        return res.status(400).json({ mensagem: "Código expirado. Faça login novamente." });
      }

      if (usuario.codigo2FA !== codigo) {
        return res.status(401).json({ mensagem: "Código incorreto." });
      }

      usuario.codigo2FA = null;
      usuario.expiracaoCodigo2FA = null;
      await usuario.save();

      return res.status(200).json({
        mensagem: "Autenticação 2FA concluída com sucesso!",
        usuario: {
          id: usuario._id,
          nome: usuario.nome,
          email: usuario.email,
        },
      });
    } catch (erro) {
      return res.status(500).json({ mensagem: "Erro ao verificar código.", erro: erro.message });
    }
  };
}

module.exports = AuthController;