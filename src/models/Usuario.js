const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const usuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    senha: {
      type: String,
      required: true,
    },
    codigo2FA: {
      type: String,
      default: null,
    },
    expiracaoCodigo2FA: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Letra E: Criptografa a senha automaticamente antes de salvar no banco
usuarioSchema.pre("save", async function () {
  if (!this.isModified("senha")) return;
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

module.exports = Usuario;