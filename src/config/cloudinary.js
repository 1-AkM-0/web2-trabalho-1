const cloudinary = require("cloudinary").v2;

function configurarCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Credenciais do Cloudinary não configuradas. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

/**
 * Envia um buffer de imagem para o Cloudinary.
 * O multer mantém o arquivo em memória (memoryStorage), o que funciona no
 * ambiente serverless da Vercel, onde não podemos gravar no disco.
 */
function enviarImagem(buffer, opcoes = {}) {
  const cloud = configurarCloudinary();
  const folder = opcoes.folder || process.env.CLOUDINARY_FOLDER || "web2-trabalho-1";

  return new Promise((resolve, reject) => {
    const uploadStream = cloud.uploader.upload_stream(
      { folder, resource_type: "image" },
      (erro, resultado) => {
        if (erro) {
          return reject(erro);
        }

        return resolve({
          url: resultado.secure_url,
          publicId: resultado.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

async function excluirImagem(publicId) {
  if (!publicId) {
    return;
  }

  const cloud = configurarCloudinary();
  await cloud.uploader.destroy(publicId, { resource_type: "image" });
}

module.exports = { enviarImagem, excluirImagem };
