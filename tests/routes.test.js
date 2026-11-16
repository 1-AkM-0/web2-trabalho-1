jest.mock("../src/config/db", () => ({
  connectDB: jest.fn().mockResolvedValue({}),
}));

jest.mock("../src/config/cloudinary", () => ({
  enviarImagem: jest.fn(),
  excluirImagem: jest.fn(),
}));

jest.mock("../src/models/Item", () => ({
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../src/models/Log", () => ({
  find: jest.fn(),
  create: jest.fn(),
}));

const mockSendMail = jest.fn();

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

jest.mock("../src/models/Usuario", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const request = require("supertest");
const app = require("../src/app");
const Item = require("../src/models/Item");
const Log = require("../src/models/Log");
const Usuario = require("../src/models/Usuario");
const { enviarImagem, excluirImagem } = require("../src/config/cloudinary");
const { connectDB } = require("../src/config/db");

const ID_VALIDO = "507f1f77bcf86cd799439011";
const ID_INVALIDO = "id-invalido";
const EMAIL_USER_ORIGINAL = process.env.EMAIL_USER;
const EMAIL_PASS_ORIGINAL = process.env.EMAIL_PASS;

afterAll(() => {
  if (EMAIL_USER_ORIGINAL === undefined) {
    delete process.env.EMAIL_USER;
  } else {
    process.env.EMAIL_USER = EMAIL_USER_ORIGINAL;
  }

  if (EMAIL_PASS_ORIGINAL === undefined) {
    delete process.env.EMAIL_PASS;
  } else {
    process.env.EMAIL_PASS = EMAIL_PASS_ORIGINAL;
  }
});

describe("API web2-trabalho-1", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    process.env.EMAIL_USER = "teste@example.com";
    process.env.EMAIL_PASS = "senha-de-app";
    connectDB.mockResolvedValue({});
    Item.find.mockResolvedValue([]);
    Item.create.mockResolvedValue({ id: "novo-id", nome: "coxinha" });
    Item.findById.mockResolvedValue(null);
    Log.find.mockResolvedValue([]);
    Log.create.mockResolvedValue({});
    Usuario.findOne.mockResolvedValue(null);
    Usuario.create.mockResolvedValue({
      _id: "usuario-id",
      nome: "Teste",
      email: "teste@example.com",
    });
    mockSendMail.mockResolvedValue({});
    enviarImagem.mockResolvedValue({
      url: "https://res.cloudinary.com/demo/image/upload/coxinha.png",
      publicId: "web2-trabalho-1/coxinha",
    });
    excluirImagem.mockResolvedValue();
  });

  describe("GET /", () => {
    test("retorna o status da API", async () => {
      const resposta = await request(app).get("/");

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({
        status: "ok",
        mensagem: "API rodando. Use /api/itens, /api/pdf, /api/logs",
      });
      expect(connectDB).not.toHaveBeenCalled();
    });
  });

  describe("Rotas de itens", () => {
    test("GET /api/itens lista os itens do MongoDB", async () => {
      Item.find.mockResolvedValue([{ id: "1", nome: "pão carioca" }]);

      const resposta = await request(app).get("/api/itens");

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({ itens: [{ id: "1", nome: "pão carioca" }] });
      expect(Item.find).toHaveBeenCalledTimes(1);
    });

    test("POST /api/itens cria um item", async () => {
      const resposta = await request(app)
        .post("/api/itens")
        .send({ nome: "coxinha" });

      expect(resposta.status).toBe(201);
      expect(resposta.body.mensagem).toBe("Item inserido com sucesso!");
      expect(resposta.body.item).toEqual({ id: "novo-id", nome: "coxinha" });
      expect(Item.create).toHaveBeenCalledWith({ nome: "coxinha" });
    });

    test("POST /api/itens remove espaços do nome", async () => {
      await request(app).post("/api/itens").send({ nome: "  bolo mole  " });

      expect(Item.create).toHaveBeenCalledWith({ nome: "bolo mole" });
    });

    test("POST /api/itens rejeita corpo vazio", async () => {
      const resposta = await request(app).post("/api/itens").send({});

      expect(resposta.status).toBe(400);
      expect(resposta.body.mensagem).toContain("Nenhum dado");
      expect(Item.create).not.toHaveBeenCalled();
    });

    test("POST /api/itens exige o campo nome", async () => {
      const resposta = await request(app).post("/api/itens").send({ outro: "valor" });

      expect(resposta.status).toBe(400);
      expect(resposta.body.mensagem).toContain("precisa de ter um 'nome'");
      expect(Item.create).not.toHaveBeenCalled();
    });

    test("POST /api/itens rejeita nome em branco", async () => {
      const resposta = await request(app).post("/api/itens").send({ nome: "   " });

      expect(resposta.status).toBe(400);
      expect(Item.create).not.toHaveBeenCalled();
    });

    test("POST /api/itens retorna 400 para JSON inválido", async () => {
      const resposta = await request(app)
        .post("/api/itens")
        .set("Content-Type", "application/json")
        .send('{"nome":');

      expect(resposta.status).toBe(400);
    });

    test("GET /api/itens/:id encontra um item", async () => {
      const item = { id: ID_VALIDO, nome: "bolo de cenoura" };
      Item.findById.mockResolvedValue(item);

      const resposta = await request(app).get(`/api/itens/${ID_VALIDO}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual(item);
      expect(Item.findById).toHaveBeenCalledWith(ID_VALIDO);
    });

    test("GET /api/itens/:id retorna 404 quando não existe", async () => {
      const resposta = await request(app).get(`/api/itens/${ID_VALIDO}`);

      expect(resposta.status).toBe(404);
      expect(resposta.body.mensagem).toBe("Item não encontrado.");
    });

    test("GET /api/itens/:id retorna 400 para ID inválido", async () => {
      const resposta = await request(app).get(`/api/itens/${ID_INVALIDO}`);

      expect(resposta.status).toBe(400);
      expect(Item.findById).not.toHaveBeenCalled();
    });

    test("DELETE /api/itens/:id exclui o item e sua imagem", async () => {
      const item = {
        id: ID_VALIDO,
        nome: "coxinha",
        imagemPublicId: "web2-trabalho-1/coxinha",
        deleteOne: jest.fn().mockResolvedValue(),
      };
      Item.findById.mockResolvedValue(item);

      const resposta = await request(app).delete(`/api/itens/${ID_VALIDO}`);

      expect(resposta.status).toBe(200);
      expect(excluirImagem).toHaveBeenCalledWith("web2-trabalho-1/coxinha");
      expect(item.deleteOne).toHaveBeenCalledTimes(1);
    });

    test("DELETE /api/itens/:id não tenta apagar imagem inexistente", async () => {
      const item = {
        id: ID_VALIDO,
        nome: "coxinha",
        imagemPublicId: null,
        deleteOne: jest.fn().mockResolvedValue(),
      };
      Item.findById.mockResolvedValue(item);

      const resposta = await request(app).delete(`/api/itens/${ID_VALIDO}`);

      expect(resposta.status).toBe(200);
      expect(excluirImagem).not.toHaveBeenCalled();
    });

    test("DELETE /api/itens/:id retorna 404 quando não existe", async () => {
      const resposta = await request(app).delete(`/api/itens/${ID_VALIDO}`);

      expect(resposta.status).toBe(404);
      expect(resposta.body.mensagem).toContain("não encontrado");
    });

    test("DELETE /api/itens/:id retorna 400 para ID inválido", async () => {
      const resposta = await request(app).delete(`/api/itens/${ID_INVALIDO}`);

      expect(resposta.status).toBe(400);
      expect(Item.findById).not.toHaveBeenCalled();
    });
  });

  describe("Rotas de imagem do item", () => {
    test("POST /api/itens/:id/imagem envia a imagem para o Cloudinary", async () => {
      const item = {
        id: ID_VALIDO,
        nome: "coxinha",
        imagemUrl: null,
        imagemPublicId: null,
        save: jest.fn().mockResolvedValue(),
      };
      Item.findById.mockResolvedValue(item);

      const resposta = await request(app)
        .post(`/api/itens/${ID_VALIDO}/imagem`)
        .attach("imagem", Buffer.from("conteudo-da-imagem"), {
          filename: "coxinha.png",
          contentType: "image/png",
        });

      expect(resposta.status).toBe(200);
      expect(resposta.body.mensagem).toBe("Imagem enviada com sucesso!");
      expect(enviarImagem).toHaveBeenCalledTimes(1);
      expect(item.imagemUrl).toBe("https://res.cloudinary.com/demo/image/upload/coxinha.png");
      expect(item.imagemPublicId).toBe("web2-trabalho-1/coxinha");
      expect(item.save).toHaveBeenCalledTimes(1);
    });

    test("POST /api/itens/:id/imagem substitui a imagem antiga", async () => {
      const item = {
        id: ID_VALIDO,
        imagemUrl: "https://antiga.png",
        imagemPublicId: "web2-trabalho-1/antiga",
        save: jest.fn().mockResolvedValue(),
      };
      Item.findById.mockResolvedValue(item);

      await request(app)
        .post(`/api/itens/${ID_VALIDO}/imagem`)
        .attach("imagem", Buffer.from("nova-imagem"), {
          filename: "nova.png",
          contentType: "image/png",
        });

      expect(excluirImagem).toHaveBeenCalledWith("web2-trabalho-1/antiga");
    });

    test("POST /api/itens/:id/imagem exige um arquivo", async () => {
      const resposta = await request(app).post(`/api/itens/${ID_VALIDO}/imagem`);

      expect(resposta.status).toBe(400);
      expect(resposta.body.mensagem).toContain("campo 'imagem'");
      expect(enviarImagem).not.toHaveBeenCalled();
    });

    test("POST /api/itens/:id/imagem rejeita arquivo que não é imagem", async () => {
      const resposta = await request(app)
        .post(`/api/itens/${ID_VALIDO}/imagem`)
        .attach("imagem", Buffer.from("texto"), {
          filename: "arquivo.txt",
          contentType: "text/plain",
        });

      expect(resposta.status).toBe(400);
      expect(resposta.body.mensagem).toBe("Envie apenas arquivos de imagem.");
    });

    test("POST /api/itens/:id/imagem retorna 404 quando o item não existe", async () => {
      const resposta = await request(app)
        .post(`/api/itens/${ID_VALIDO}/imagem`)
        .attach("imagem", Buffer.from("imagem"), {
          filename: "foto.png",
          contentType: "image/png",
        });

      expect(resposta.status).toBe(404);
      expect(enviarImagem).not.toHaveBeenCalled();
    });

    test("POST /api/itens/:id/imagem retorna 400 para ID inválido", async () => {
      const resposta = await request(app)
        .post(`/api/itens/${ID_INVALIDO}/imagem`)
        .attach("imagem", Buffer.from("imagem"), {
          filename: "foto.png",
          contentType: "image/png",
        });

      expect(resposta.status).toBe(400);
    });

    test("DELETE /api/itens/:id/imagem remove a imagem do Cloudinary", async () => {
      const item = {
        id: ID_VALIDO,
        imagemUrl: "https://imagem.png",
        imagemPublicId: "web2-trabalho-1/imagem",
        save: jest.fn().mockResolvedValue(),
      };
      Item.findById.mockResolvedValue(item);

      const resposta = await request(app).delete(`/api/itens/${ID_VALIDO}/imagem`);

      expect(resposta.status).toBe(200);
      expect(excluirImagem).toHaveBeenCalledWith("web2-trabalho-1/imagem");
      expect(item.imagemUrl).toBeNull();
      expect(item.imagemPublicId).toBeNull();
      expect(item.save).toHaveBeenCalledTimes(1);
    });

    test("DELETE /api/itens/:id/imagem retorna 404 quando não há imagem", async () => {
      Item.findById.mockResolvedValue({
        id: ID_VALIDO,
        imagemUrl: null,
        imagemPublicId: null,
      });

      const resposta = await request(app).delete(`/api/itens/${ID_VALIDO}/imagem`);

      expect(resposta.status).toBe(404);
      expect(excluirImagem).not.toHaveBeenCalled();
    });
  });

  describe("Rotas de PDF", () => {
    test("GET /api/pdf gera o PDF com os itens", async () => {
      Item.find.mockResolvedValue([{ nome: "pão carioca" }, { nome: "coxinha" }]);

      const resposta = await request(app).get("/api/pdf");

      expect(resposta.status).toBe(200);
      expect(resposta.headers["content-type"]).toContain("application/pdf");
      expect(resposta.headers["content-disposition"]).toContain("lista.pdf");
      expect(resposta.body.length).toBeGreaterThan(0);
    });
  });

  describe("Rotas de logs", () => {
    test("GET /api/logs exige o parâmetro data", async () => {
      const resposta = await request(app).get("/api/logs");

      expect(resposta.status).toBe(400);
      expect(resposta.body.erro).toContain("Informe a data");
    });

    test("GET /api/logs devolve os logs da data consultada", async () => {
      const logs = [
        { rota: "/api/itens", data: "2026-11-15" },
        { rota: "/api/pdf", data: "2026-11-15" },
      ];
      Log.find.mockResolvedValue(logs);

      const resposta = await request(app).get("/api/logs?data=2026-11-15");

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual({
        total: 2,
        dataConsultada: "2026-11-15",
        logs,
      });
      expect(Log.find).toHaveBeenCalledWith({ data: "2026-11-15" });
    });

    test("as rotas registram o log no MongoDB", async () => {
      await request(app).get("/api/itens");

      expect(Log.create).toHaveBeenCalledWith({
        rota: "/api/itens",
        data: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });
    });
  });

  describe("Página de exportação", () => {
    test("GET /exportar entrega o HTML com o botão Exportar", async () => {
      const resposta = await request(app).get("/exportar");

      expect(resposta.status).toBe(200);
      expect(resposta.headers["content-type"]).toContain("text/html");
      expect(resposta.text).toContain("Exportar dados");
      expect(resposta.text).toContain('id="exportar"');
    });
  });

  describe("Exportação CSV", () => {
    test("GET /api/itens/exportar baixa o CSV com cabeçalho e dados", async () => {
      Item.find.mockResolvedValue([
        {
          id: "id-1",
          nome: "pão carioca",
          imagemUrl: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-02T00:00:00.000Z"),
        },
        {
          id: "id-2",
          nome: "coxinha",
          imagemUrl: "https://exemplo.com/coxinha.png",
          createdAt: new Date("2026-01-03T00:00:00.000Z"),
          updatedAt: new Date("2026-01-04T00:00:00.000Z"),
        },
      ]);

      const resposta = await request(app).get("/api/itens/exportar");

      expect(resposta.status).toBe(200);
      expect(resposta.headers["content-type"]).toContain("text/csv");
      expect(resposta.headers["content-disposition"]).toContain('filename="itens.csv"');

      const csv = resposta.text.replace(/^\uFEFF/, "");
      const linhas = csv.split("\r\n");

      expect(linhas[0]).toBe('"id","nome","imagemUrl","criadoEm","atualizadoEm"');
      expect(linhas[1]).toBe(
        '"id-1","pão carioca","","2026-01-01T00:00:00.000Z","2026-01-02T00:00:00.000Z"'
      );
      expect(linhas[2]).toBe(
        '"id-2","coxinha","https://exemplo.com/coxinha.png","2026-01-03T00:00:00.000Z","2026-01-04T00:00:00.000Z"'
      );
    });

    test("escapa aspas e neutraliza fórmulas no CSV", async () => {
      Item.find.mockResolvedValue([
        {
          id: "id-1",
          nome: '=1+1; "aspas"',
          imagemUrl: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ]);

      const resposta = await request(app).get("/api/itens/exportar");
      const csv = resposta.text.replace(/^\uFEFF/, "");

      expect(csv).toContain(`"'=1+1; ""aspas"""`);
    });

    test("usa o _id quando o documento não tiver o virtual id", async () => {
      Item.find.mockResolvedValue([
        {
          _id: { toString: () => "id-do-mongo" },
          nome: "bolo mole",
          imagemUrl: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ]);

      const resposta = await request(app).get("/api/itens/exportar");
      const csv = resposta.text.replace(/^\uFEFF/, "");

      expect(csv).toContain('"id-do-mongo","bolo mole"');
    });
  });

  describe("CORS", () => {
    test("permite a mesma origem", async () => {
      const resposta = await request(app)
        .get("/api/itens")
        .set("Host", "exemplo.vercel.app")
        .set("X-Forwarded-Proto", "https")
        .set("Origin", "https://exemplo.vercel.app");

      expect(resposta.status).toBe(200);
      expect(resposta.headers["access-control-allow-origin"]).toBe("https://exemplo.vercel.app");
      expect(resposta.headers["access-control-allow-methods"]).toContain("GET");
      expect(resposta.headers["access-control-allow-headers"]).toContain("Content-Type");
      expect(resposta.headers.vary).toContain("Origin");
    });

    test("bloqueia origem diferente", async () => {
      const resposta = await request(app)
        .get("/api/itens")
        .set("Host", "exemplo.vercel.app")
        .set("X-Forwarded-Proto", "https")
        .set("Origin", "https://outro.vercel.app");

      expect(resposta.status).toBe(403);
      expect(resposta.body.mensagem).toBe("Origem não permitida.");
      expect(resposta.headers["access-control-allow-origin"]).toBeUndefined();
    });

    test("responde ao preflight OPTIONS da mesma origem", async () => {
      const resposta = await request(app)
        .options("/api/itens")
        .set("Host", "exemplo.vercel.app")
        .set("X-Forwarded-Proto", "https")
        .set("Origin", "https://exemplo.vercel.app")
        .set("Access-Control-Request-Method", "GET");

      expect(resposta.status).toBe(204);
      expect(resposta.headers["access-control-allow-origin"]).toBe("https://exemplo.vercel.app");
      expect(resposta.headers["access-control-allow-methods"]).toContain("OPTIONS");
    });

    test("permite chamadas sem o cabeçalho Origin", async () => {
      const resposta = await request(app).get("/api/itens");

      expect(resposta.status).toBe(200);
      expect(resposta.headers["access-control-allow-origin"]).toBeUndefined();
    });

    test("bloqueia origem inválida ou opaca", async () => {
      const resposta = await request(app)
        .get("/api/itens")
        .set("Host", "localhost:3000")
        .set("Origin", "null");

      expect(resposta.status).toBe(403);
      expect(resposta.body.mensagem).toBe("Origem não permitida.");
    });
  });

  describe("Rotas de autenticação", () => {
    describe("POST /api/auth/registrar", () => {
      test("cadastra um usuário", async () => {
        const resposta = await request(app).post("/api/auth/registrar").send({
          nome: "Teste",
          email: "teste@example.com",
          senha: "senha123",
        });

        expect(resposta.status).toBe(201);
        expect(resposta.body.mensagem).toBe("Usuário cadastrado com sucesso!");
        expect(resposta.body.usuario).toEqual({
          id: "usuario-id",
          nome: "Teste",
          email: "teste@example.com",
        });
        expect(Usuario.findOne).toHaveBeenCalledWith({ email: "teste@example.com" });
        expect(Usuario.create).toHaveBeenCalledWith({
          nome: "Teste",
          email: "teste@example.com",
          senha: "senha123",
        });
      });

      test("exige nome, email e senha", async () => {
        const resposta = await request(app)
          .post("/api/auth/registrar")
          .send({ nome: "Teste" });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toBe("Nome, email e senha são obrigatórios.");
        expect(Usuario.create).not.toHaveBeenCalled();
      });

      test("rejeita email já cadastrado", async () => {
        Usuario.findOne.mockResolvedValue({ _id: "existente" });

        const resposta = await request(app).post("/api/auth/registrar").send({
          nome: "Teste",
          email: "teste@example.com",
          senha: "senha123",
        });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toBe("Este email já está cadastrado.");
        expect(Usuario.create).not.toHaveBeenCalled();
      });
    });

    describe("POST /api/auth/login", () => {
      test("exige email e senha", async () => {
        const resposta = await request(app)
          .post("/api/auth/login")
          .send({ email: "teste@example.com" });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toBe("Email e senha são obrigatórios.");
      });

      test("rejeita usuário inexistente", async () => {
        const resposta = await request(app).post("/api/auth/login").send({
          email: "teste@example.com",
          senha: "senha123",
        });

        expect(resposta.status).toBe(401);
        expect(resposta.body.mensagem).toBe("Credenciais inválidas.");
      });

      test("rejeita senha incorreta", async () => {
        const senhaHash = await bcrypt.hash("senha123", 4);
        Usuario.findOne.mockResolvedValue({
          email: "teste@example.com",
          senha: senhaHash,
        });

        const resposta = await request(app).post("/api/auth/login").send({
          email: "teste@example.com",
          senha: "senha-errada",
        });

        expect(resposta.status).toBe(401);
        expect(resposta.body.mensagem).toBe("Credenciais inválidas.");
        expect(mockSendMail).not.toHaveBeenCalled();
      });

      test("envia código 2FA por email após senha correta", async () => {
        const senhaHash = await bcrypt.hash("senha123", 4);
        const usuario = {
          email: "teste@example.com",
          senha: senhaHash,
          save: jest.fn().mockResolvedValue(),
        };
        Usuario.findOne.mockResolvedValue(usuario);

        const resposta = await request(app).post("/api/auth/login").send({
          email: "teste@example.com",
          senha: "senha123",
        });

        expect(resposta.status).toBe(200);
        expect(resposta.body.mensagem).toBe("Código de verificação enviado para o seu email.");
        expect(usuario.codigo2FA).toMatch(/^\d{6}$/);
        expect(usuario.expiracaoCodigo2FA).toBeInstanceOf(Date);
        expect(usuario.save).toHaveBeenCalledTimes(1);
        expect(mockSendMail).toHaveBeenCalledTimes(1);
        expect(mockSendMail.mock.calls[0][0].to).toBe("teste@example.com");
        expect(mockSendMail.mock.calls[0][0].text).toContain(usuario.codigo2FA);
      });
    });

    describe("POST /api/auth/verificar-2fa", () => {
      test("exige email e código", async () => {
        const resposta = await request(app)
          .post("/api/auth/verificar-2fa")
          .send({ email: "teste@example.com" });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toBe("Email e código são obrigatórios.");
      });

      test("rejeita solicitação sem código pendente", async () => {
        const resposta = await request(app).post("/api/auth/verificar-2fa").send({
          email: "teste@example.com",
          codigo: "123456",
        });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toBe("Solicitação de código inválida.");
      });

      test("rejeita código expirado", async () => {
        Usuario.findOne.mockResolvedValue({
          codigo2FA: "123456",
          expiracaoCodigo2FA: new Date(Date.now() - 1000),
          save: jest.fn(),
        });

        const resposta = await request(app).post("/api/auth/verificar-2fa").send({
          email: "teste@example.com",
          codigo: "123456",
        });

        expect(resposta.status).toBe(400);
        expect(resposta.body.mensagem).toBe("Código expirado. Faça login novamente.");
      });

      test("rejeita código incorreto", async () => {
        Usuario.findOne.mockResolvedValue({
          codigo2FA: "123456",
          expiracaoCodigo2FA: new Date(Date.now() + 60000),
          save: jest.fn(),
        });

        const resposta = await request(app).post("/api/auth/verificar-2fa").send({
          email: "teste@example.com",
          codigo: "000000",
        });

        expect(resposta.status).toBe(401);
        expect(resposta.body.mensagem).toBe("Código incorreto.");
      });

      test("confirma o código e limpa os dados temporários", async () => {
        const usuario = {
          _id: "usuario-id",
          nome: "Teste",
          email: "teste@example.com",
          codigo2FA: "123456",
          expiracaoCodigo2FA: new Date(Date.now() + 60000),
          save: jest.fn().mockResolvedValue(),
        };
        Usuario.findOne.mockResolvedValue(usuario);

        const resposta = await request(app).post("/api/auth/verificar-2fa").send({
          email: "teste@example.com",
          codigo: "123456",
        });

        expect(resposta.status).toBe(200);
        expect(resposta.body.mensagem).toBe("Autenticação 2FA concluída com sucesso!");
        expect(resposta.body.usuario).toEqual({
          id: "usuario-id",
          nome: "Teste",
          email: "teste@example.com",
        });
        expect(usuario.codigo2FA).toBeNull();
        expect(usuario.expiracaoCodigo2FA).toBeNull();
        expect(usuario.save).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Rota inexistente", () => {
    test("retorna 404 em JSON", async () => {
      const resposta = await request(app).get("/api/nao-existe");

      expect(resposta.status).toBe(404);
      expect(resposta.body.mensagem).toBe("Rota não encontrada.");
    });
  });
});
