import axios from "axios";
import sharp from "sharp";

const LARGURA_BANNER = 1400;
const ALTURA_BANNER = 900;

// ===== LOGO =====
const CAMINHO_LOGO = "./logo.png"; // caminho da sua logo
const TAMANHO_LOGO = 500;          // tamanho da logo (altura e largura máximas)
const MARGEM_LOGO = 30;            // distância da borda direita e de baixo

// ===== PRODUTO =====
// Largura em 70% para sobrar espaço no canto da logo
// e ela não ficar por cima do produto
const LARGURA_PRODUTO = Math.floor(LARGURA_BANNER * 0.70);
const ALTURA_PRODUTO = Math.floor(ALTURA_BANNER * 0.84);

// A logo é preparada uma vez só e reaproveitada em todos os banners
let logoCache = null;

async function carregarLogo() {
    if (logoCache) return logoCache;

    const { data, info } = await sharp(CAMINHO_LOGO)
        .resize({
            width: TAMANHO_LOGO,
            height: TAMANHO_LOGO,
            fit: "inside"
        })
        .png()
        .toBuffer({ resolveWithObject: true });

    logoCache = {
        buffer: data,
        largura: info.width,
        altura: info.height
    };

    return logoCache;
}

export async function criarBannerAmazon(imageUrl) {
    const resposta = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 15000
    });

    const input = Buffer.from(resposta.data);

    const { data: produto, info: infoProduto } = await sharp(input)
        .trim()
        .resize({
            width: LARGURA_PRODUTO,
            height: ALTURA_PRODUTO,
            fit: "inside"
        })
        .toBuffer({ resolveWithObject: true });

    const logo = await carregarLogo();

    // Produto centralizado no banner
    const produtoTop = Math.floor((ALTURA_BANNER - infoProduto.height) / 2);
    const produtoLeft = Math.floor((LARGURA_BANNER - infoProduto.width) / 2);

    // Logo no canto inferior direito
    const logoTop = ALTURA_BANNER - logo.altura - 80;
    const logoLeft = LARGURA_BANNER - logo.largura - MARGEM_LOGO;

    const final = await sharp({
        create: {
            width: LARGURA_BANNER,
            height: ALTURA_BANNER,
            channels: 3,
            background: "#ffffff"
        }
    })
        .composite([
            { input: produto, top: produtoTop, left: produtoLeft },
            { input: logo.buffer, top: logoTop, left: logoLeft }
        ])
        .jpeg({ quality: 82 })
        .toBuffer();

    return final;
}