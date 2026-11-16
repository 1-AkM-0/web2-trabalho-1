const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const usuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    senha: {
      type: String,
      required: true,
      select: false,
    },
    codigo2FA: {
      type: String,
      default: null,
      select: false,
    },
    expiracaoCodigo2FA: {
      type: Date,
      default: null,
    },
    tentativasCodigo2FA: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

usuarioSchema.pre("save", async function () {
  if (!this.isModified("senha")) return;
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

module.exports = Usuario;