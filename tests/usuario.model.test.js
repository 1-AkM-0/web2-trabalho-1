const bcrypt = require("bcryptjs");
const Usuario = require("../src/models/Usuario");

describe("Modelo Usuario", () => {
  test("criptografa a senha antes de salvar", async () => {
    const usuario = new Usuario({
      nome: "Teste",
      email: "teste@example.com",
      senha: "senha123",
    });

    await usuario.constructor.schema.s.hooks.execPre("save", usuario);

    expect(usuario.senha).not.toBe("senha123");
    expect(usuario.senha).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare("senha123", usuario.senha)).toBe(true);
  });
});
