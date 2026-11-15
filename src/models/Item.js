const { Schema, model } = require("mongoose");

const itemSchema = new Schema(
  {
    nome: {
      type: String,
      required: [true, "O item precisa ter um 'nome'."],
      trim: true,
    },
    imagemUrl: {
      type: String,
      default: null,
    },
    imagemPublicId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.imagemPublicId;
        return ret;
      },
    },
  }
);

module.exports = model("Item", itemSchema);
