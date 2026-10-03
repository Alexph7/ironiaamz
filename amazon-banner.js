import axios from "axios";
import sharp from "sharp";

const LARGURA_BANNER = 1400;
const ALTURA_BANNER = 900;

const LARGURA_PRODUTO =
    Math.floor(LARGURA_BANNER * 0.84);

const ALTURA_PRODUTO =
    Math.floor(ALTURA_BANNER * 0.84);

export async function criarBannerAmazon(
    imageUrl
) {
    const resposta =
        await axios.get(
            imageUrl,
            {
                responseType:
                    "arraybuffer",

                timeout: 15000
            }
        );

    const input =
        Buffer.from(
            resposta.data
        );

    const produto =
        await sharp(input)
            .trim()
            .resize({
                width:
                    LARGURA_PRODUTO,

                height:
                    ALTURA_PRODUTO,

                fit:
                    "inside"
            })
            .toBuffer();

    const banner =
        sharp({
            create: {
                width:
                    LARGURA_BANNER,

                height:
                    ALTURA_BANNER,

                channels: 3,

                background:
                    "#ffffff"
            }
        });

    const final =
        await banner
            .composite([
                {
                    input:
                        produto,

                    gravity:
                        "center"
                }
            ])
            .jpeg({
                quality: 82
            })
            .toBuffer();

    return final;
}