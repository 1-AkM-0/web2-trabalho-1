# web2-trabalho-1

API em Express para o trabalho de Web 2, com dados no MongoDB Atlas, imagens no
Cloudinary e testes automatizados com Jest.

## Stack

- Node.js + Express 5
- MongoDB Atlas + Mongoose (item A)
- Cloudinary + Multer (item B)
- Jest + Supertest (item C)
- Deploy na Vercel

## Configuração do ambiente

Copie o arquivo de exemplo e preencha as credenciais:

```bash
cp .env.example .env
```

| Variável | Descrição |
| --- | --- |
| `MONGODB_URI` | String de conexão do MongoDB Atlas, incluindo o nome do banco |
| `MONGODB_DB` | Nome do banco caso a URI não informe (padrão: `web2-trabalho-1`) |
| `CLOUDINARY_CLOUD_NAME` | Cloud name do Cloudinary |
| `CLOUDINARY_API_KEY` | API key do Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret do Cloudinary |
| `CLOUDINARY_FOLDER` | Pasta onde as imagens serão salvas (opcional) |

### Item A — MongoDB Atlas

1. Crie uma conta gratuita em <https://www.mongodb.com/cloud/atlas> e um cluster **M0 (free)**.
2. Em **Database Access**, crie um usuário com senha.
3. Em **Network Access**, libere o acesso da Vercel. Para um trabalho, `0.0.0.0/0`
   é o caminho mais simples (restrinja em produção real).
4. Em **Connect → Drivers**, copie a string `mongodb+srv://...` e troque
   `<password>` pela senha do usuário. Inclua o nome do banco antes do `?`:
   `mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/web2-trabalho-1?retryWrites=true&w=majority`
5. Coloque essa string em `MONGODB_URI`.

A conexão é cacheada em `src/config/db.js` para funcionar bem no modelo
serverless da Vercel, onde cada requisição pode executar em uma instância
diferente.

Para popular o banco com os itens iniciais:

```bash
npm run seed
```

Para conferir a conexão e o conteúdo do banco em desenvolvimento:

```bash
npm run db:check
```

Esse comando mostra o host, o nome do banco, as coleções, a quantidade de
documentos, os primeiros itens e os logs do dia. Ele é somente leitura, então
pode ser executado à vontade.

> Dica: para não misturar dados de desenvolvimento com os de produção, use um
> banco separado no mesmo cluster, por exemplo `MONGODB_DB=web2-trabalho-1-dev`
> no seu `.env` local. Na Vercel, mantenha `MONGODB_DB=web2-trabalho-1`.

### Banco de desenvolvimento e trabalho em equipe

O MongoDB cria o banco automaticamente no primeiro documento inserido. O banco
`web2-trabalho-1-dev` já está criado no cluster com os 5 itens iniciais.

Para usar o banco de dev localmente, adicione ao `.env`:

```env
MONGODB_DB=web2-trabalho-1-dev
```

Depois confira:

```bash
npm run seed      # só insere se o banco estiver vazio
npm run db:check  # mostra o banco, coleções e documentos
```

**Para compartilhar com os integrantes (banco de dev comum):**

1. No Atlas, vá em **Database Access → Add New Database User**.
2. Crie um usuário só para dev, por exemplo `web2-dev`, com uma senha forte.
3. Em permissões, escolha **Specific Privileges** e dê `readWrite` apenas no
   banco `web2-trabalho-1-dev`.
4. Em **Network Access**, libere `0.0.0.0/0` (aceitável no trabalho) ou os IPs
   da equipe.
5. Cada integrante cria seu próprio `.env` a partir do `.env.example`, usando a
   mesma `MONGODB_URI` e `MONGODB_DB=web2-trabalho-1-dev`.
6. Compartilhe a senha por gerenciador de senhas ou mensagem privada. Nunca
   commite o `.env` nem coloque credenciais no README.

Se preferir que cada um tenha um banco isolado, use nomes diferentes no mesmo
cluster, como `web2-trabalho-1-dev-pedro` e `web2-trabalho-1-dev-maria`. O
cluster e a URI continuam os mesmos; só o `MONGODB_DB` muda.

**Na Vercel**, separe os ambientes:

- **Production:** `MONGODB_DB=web2-trabalho-1`
- **Preview:** `MONGODB_DB=web2-trabalho-1-dev`

Assim, deploys de preview não mexem nos dados reais.

### Item B — Imagens no Cloudinary

1. Crie uma conta gratuita em <https://cloudinary.com>.
2. No **Dashboard**, copie `Cloud Name`, `API Key` e `API Secret`.
3. Preencha as três variáveis `CLOUDINARY_*` no `.env` (e depois na Vercel).
4. Envie a imagem com `multipart/form-data` no campo `imagem`:

```bash
curl -X POST http://localhost:3000/api/itens/ID_DO_ITEM/imagem \
  -F "imagem=@foto.png"
```

O arquivo é recebido em memória pelo Multer (não grava no disco, que é efêmero
na Vercel), enviado ao Cloudinary e apenas a URL pública fica salva no MongoDB.
O limite é de **4 MB**, por causa do limite de body da Vercel.

### Deploy na Vercel

1. Importe o repositório na Vercel.
2. Em **Settings → Environment Variables**, adicione `MONGODB_URI`,
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` e,
   opcionalmente, `CLOUDINARY_FOLDER`.
3. Faça o redeploy. O `vercel.json` já direciona as requisições para
   `api/index.js`, que exporta o app Express.

## Rodando localmente

```bash
npm install
npm run dev
```

A API sobe em `http://localhost:3000`.

## Testes (item C)

```bash
npm test
```

Os testes usam Jest + Supertest e cobrem todas as rotas: status da API, CRUD de
itens, upload/remoção de imagem, geração de PDF, consulta de logs e rota 404. O
Mongoose e o Cloudinary são mockados, então os testes não precisam de internet,
de credenciais nem de um banco real.

## Rotas

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/` | Status da API |
| GET | `/exportar` | Página com o botão para baixar o CSV |
| GET | `/api/itens` | Lista os itens |
| GET | `/api/itens/exportar` | Baixa os itens do banco em CSV |
| POST | `/api/itens` | Cria um item (`{ "nome": "..." }`) |
| GET | `/api/itens/:id` | Busca um item por ID |
| DELETE | `/api/itens/:id` | Exclui um item e sua imagem |
| POST | `/api/itens/:id/imagem` | Envia/substitui a imagem do item |
| DELETE | `/api/itens/:id/imagem` | Remove a imagem do item |
| GET | `/api/pdf` | Baixa a lista de itens em PDF |
| GET | `/api/logs?data=YYYY-MM-DD` | Lista os logs de requisição da data |

### Itens F e H — CORS e exportação CSV

O CORS aceita uma origem de navegador somente quando ela corresponde ao
protocolo e host usados para acessar esta própria aplicação. Uma origem diferente
recebe `403 Origem não permitida`. Chamadas sem o cabeçalho `Origin` (por
exemplo, `curl` e integrações servidor a servidor) continuam disponíveis.

Abra `http://localhost:3000/exportar` (ou o domínio do deploy seguido de
`/exportar`) e clique em **Exportar**. O navegador baixa `itens.csv`, com os
campos `id`, `nome`, `imagemUrl`, `criadoEm` e `atualizadoEm`. A mesma exportação
pode ser acessada diretamente por `GET /api/itens/exportar`.

## Estrutura

```text
api/index.js              entrada da Vercel
src/app.js                configuração do Express
src/server.js             execução local
src/config/db.js          conexão com o MongoDB Atlas (com cache)
src/config/cloudinary.js  upload/remoção de imagens
src/models/               schemas Item e Log
src/controllers/          regras de negócio e exportação CSV
src/routes/               rotas da API
src/middlewares/          logs, horário e upload
src/views/exportar.html   página com o botão Exportar
tests/routes.test.js      testes de todas as rotas
scripts/seed.js           popula o banco com os itens iniciais
```
