const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const nodemailer = require("nodemailer");
const Usuario = require("../models/Usuario");
const { gerarToken } = require("../utils/authToken");

const emailValido = (email) =>
  typeof email === "string" &&
  email.trim().length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const senhaForte = (senha) =>
  typeof senha === "string" &&
  senha.length >= 8 &&
  senha.length <= 128 &&
  /[A-Za-z]/.test(senha) &&
  /\d/.test(senha);

const nomeValido = (nome) =>
  typeof nome === "string" &&
  nome.trim().length > 0 &&
  nome.trim().length <= 100;

class AuthController {
  static registrar = async (req, res) => {
    try {
      const { nome, email, senha } = req.body || {};

      if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: "Nome, email e senha são obrigatórios." });
      }
      if (!nomeValido(nome)) {
        return res.status(400).json({ mensagem: "O nome deve ter entre 1 e 100 caracteres." });
      }
      if (!emailValido(email)) {
        return res.status(400).json({ mensagem: "Formato de email inválido." });
      }
      if (!senhaForte(senha)) {
        return res.status(400).json({
          mensagem: "A senha deve ter ao menos 8 caracteres, uma letra e um número.",
        });
      }

      const emailNormalizado = email.trim().toLowerCase();
      const usuarioExistente = await Usuario.findOne({ email: emailNormalizado });
      if (usuarioExistente) {
        return res.status(409).json({ mensagem: "Este email já está cadastrado." });
      }

      const novoUsuario = await Usuario.create({
        nome: nome.trim(),
        email: emailNormalizado,
        senha,
      });

      return res.status(201).json({
        mensagem: "Usuário cadastrado com sucesso!",
        usuario: {
          id: novoUsuario._id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
        },
      });
    } catch (erro) {
      if (erro.code === 11000) {
        return res.status(409).json({ mensagem: "Este email já está cadastrado." });
      }
      console.error("Erro ao registrar usuário:", erro);
      return res.status(500).json({ mensagem: "Erro ao registrar usuário." });
    }
  };

  static login = async (req, res) => {
    try {
      const { email, senha } = req.body || {};

      if (!email || !senha) {
        return res.status(400).json({ mensagem: "Email e senha são obrigatórios." });
      }
      if (!emailValido(email)) {
        return res.status(400).json({ mensagem: "Formato de email inválido." });
      }
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(503).json({ mensagem: "Envio de email indisponível no momento." });
      }

      const usuario = await Usuario.findOne({ email: email.trim().toLowerCase() }).select("+senha");
      if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
        return res.status(401).json({ mensagem: "Credenciais inválidas." });
      }

      const codigo = String(crypto.randomInt(100000, 1000000));
      usuario.codigo2FA = await bcrypt.hash(codigo, 10);
      usuario.expiracaoCodigo2FA = new Date(Date.now() + 10 * 60 * 1000);
      usuario.tentativasCodigo2FA = 0;
      await usuario.save();

      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: usuario.email,
          subject: "Código de Verificação (2FA)",
          text: `Seu código de acesso é: ${codigo}. Ele expira em 10 minutos.`,
        });
      } catch (erroEmail) {
        usuario.codigo2FA = null;
        usuario.expiracaoCodigo2FA = null;
        usuario.tentativasCodigo2FA = 0;
        await usuario.save();
        console.error("Falha no envio do código 2FA:", erroEmail);
        return res.status(503).json({ mensagem: "Não foi possível enviar o código de verificação." });
      }

      return res.status(200).json({
        mensagem: "Código de verificação enviado para o seu email.",
      });
    } catch (erro) {
      console.error("Erro ao realizar login:", erro);
      return res.status(500).json({ mensagem: "Erro ao realizar login." });
    }
  };

  static verificar2FA = async (req, res) => {
    try {
      const { email, codigo } = req.body || {};

      if (!email || !codigo) {
        return res.status(400).json({ mensagem: "Email e código são obrigatórios." });
      }
      if (!emailValido(email) || !/^\d{6}$/.test(String(codigo))) {
        return res.status(400).json({ mensagem: "Email ou código inválido." });
      }

      const usuario = await Usuario.findOne({ email: email.trim().toLowerCase() }).select("+codigo2FA");
      if (!usuario || !usuario.codigo2FA) {
        return res.status(400).json({ mensagem: "Solicitação de código inválida." });
      }

      if (!usuario.expiracaoCodigo2FA || Date.now() > usuario.expiracaoCodigo2FA.getTime()) {
        usuario.codigo2FA = null;
        usuario.expiracaoCodigo2FA = null;
        usuario.tentativasCodigo2FA = 0;
        await usuario.save();
        return res.status(400).json({ mensagem: "Código expirado. Faça login novamente." });
      }

      if (usuario.tentativasCodigo2FA >= 5) {
        return res.status(429).json({ mensagem: "Limite de tentativas atingido. Faça login novamente." });
      }

      if (!(await bcrypt.compare(String(codigo), usuario.codigo2FA))) {
        usuario.tentativasCodigo2FA += 1;
        if (usuario.tentativasCodigo2FA >= 5) {
          usuario.codigo2FA = null;
          usuario.expiracaoCodigo2FA = null;
        }
        await usuario.save();
        return res.status(usuario.tentativasCodigo2FA >= 5 ? 429 : 401).json({
          mensagem:
            usuario.tentativasCodigo2FA >= 5
              ? "Limite de tentativas atingido. Faça login novamente."
              : "Código incorreto.",
        });
      }

      usuario.codigo2FA = null;
      usuario.expiracaoCodigo2FA = null;
      usuario.tentativasCodigo2FA = 0;
      await usuario.save();

      let token;
      try {
        token = gerarToken(usuario._id);
      } catch (erroToken) {
        console.error("JWT_SECRET não configurado.");
        return res.status(503).json({ mensagem: "Autenticação indisponível no momento." });
      }

      return res.status(200).json({
        mensagem: "Autenticação 2FA concluída com sucesso!",
        token,
        usuario: {
          id: usuario._id,
          nome: usuario.nome,
          email: usuario.email,
        },
      });
    } catch (erro) {
      console.error("Erro ao verificar código:", erro);
      return res.status(500).json({ mensagem: "Erro ao verificar código." });
    }
  };
}

module.exports = AuthController;