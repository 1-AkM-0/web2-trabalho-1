const { Schema, model } = require("mongoose");

const logSchema = new Schema(
  {
    rota: {
      type: String,
      required: true,
      trim: true,
    },
    data: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

module.exports = model("Log", logSchema);
