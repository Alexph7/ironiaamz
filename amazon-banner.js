import axios from "axios";
import sharp from "sharp";

const LARGURA_BANNER = 1400;
const ALTURA_BANNER = 900;

// ===== RODAPÉ / LOGO =====
const CAMINHO_LOGO = "./logo.png"; // troque pelo caminho da sua logo
const ALTURA_RODAPE = 120;         // faixa reservada no rodapé
const ALTURA_LOGO = 80;            // altura máxima da logo
const LARGURA_MAX_LOGO = 400;      // largura máxima da logo

// O produto agora usa só a área acima do rodapé,
// assim a logo nunca fica por cima do produto
const ALTURA_AREA_PRODUTO = ALTURA_BANNER - ALTURA_RODAPE;

const LARGURA_PRODUTO = Math.floor(LARGURA_BANNER * 0.84);
const ALTURA_PRODUTO = Math.floor(ALTURA_AREA_PRODUTO * 0.9);

// A logo é preparada uma vez só e reaproveitada em todos os banners
let logoCache = null;

async function carregarLogo() {
    if (logoCache) return logoCache;

    const { data, info } = await sharp(CAMINHO_LOGO)
        .resize({
            width: LARGURA_MAX_LOGO,
            height: ALTURA_LOGO,
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

    // Produto centralizado na área de cima
    const produtoTop = Math.floor((ALTURA_AREA_PRODUTO - infoProduto.height) / 2);
    const produtoLeft = Math.floor((LARGURA_BANNER - infoProduto.width) / 2);

    // Logo centralizada no rodapé
    const logoTop = ALTURA_AREA_PRODUTO + Math.floor((ALTURA_RODAPE - logo.altura) / 2);
    const logoLeft = Math.floor((LARGURA_BANNER - logo.largura) / 2);

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