import "dotenv/config";

import {
    existsSync,
    readFileSync,
    writeFileSync
} from "node:fs";

import {
    fileURLToPath
} from "node:url";

const AMAZON_COOKIE =
    process.env.AMAZON_COOKIE;

const MARKETPLACE_ID =
    "526970";

const ARQUIVO_CACHE =
    fileURLToPath(
        new URL(
            "./links-curtos-amazon.json",
            import.meta.url
        )
    );


let cacheLinks = {};


if (existsSync(ARQUIVO_CACHE)) {

    try {

        cacheLinks =
            JSON.parse(
                readFileSync(
                    ARQUIVO_CACHE,
                    "utf8"
                )
            );

    } catch (erro) {

        console.log(
            "LINK CURTO: ERRO AO LER CACHE:",
            erro.message
        );

        cacheLinks = {};
    }
}


function salvarCache() {

    try {

        writeFileSync(
            ARQUIVO_CACHE,
            JSON.stringify(
                cacheLinks,
                null,
                2
            ),
            "utf8"
        );

    } catch (erro) {

        console.log(
            "LINK CURTO: ERRO AO SALVAR CACHE:",
            erro.message
        );
    }
}


function extrairAsinDoLink(
    url
) {

    const match =
        url.match(
            /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i
        );

    return match
        ? match[1].toUpperCase()
        : null;
}

export async function gerarLinkCurtoAmazon(
    longUrl
) {

    if (!longUrl) {
        return null;
    }

    const asin =
        extrairAsinDoLink(
            longUrl
        );


    if (
        asin &&
        cacheLinks[asin]
    ) {

        console.log(
            "LINK CURTO: CACHE:",
            cacheLinks[asin]
        );

        return cacheLinks[asin];
    }

    /**
     * Se não houver cookie configurado,
     * mantém o link original.
     */
    if (!AMAZON_COOKIE) {

        console.log(
            "LINK CURTO: AMAZON_COOKIE NÃO CONFIGURADO"
        );

        return longUrl;
    }

    try {

        const url =
            new URL(
                "https://www.amazon.com.br/associates/sitestripe/getShortUrl"
            );

        url.searchParams.set(
            "longUrl",
            longUrl
        );

        url.searchParams.set(
            "marketplaceId",
            MARKETPLACE_ID
        );

        const resposta =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        "Cookie":
                            AMAZON_COOKIE,

                        "Accept":
                            "application/json, text/javascript, */*; q=0.01",

                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0.0.0 Safari/537.36",

                        "Referer":
                            "https://www.amazon.com.br/"
                    },

                    signal:
                        AbortSignal.timeout(
                            15000
                        )
                }
            );

        if (!resposta.ok) {

            console.log(
                "LINK CURTO: HTTP",
                resposta.status
            );

            return longUrl;
        }

        const dados =
            await resposta.json();

        if (
            dados?.isOk === true &&
            dados?.shortUrl
        ) {

            console.log(
                "LINK CURTO:",
                dados.shortUrl
            );

            if (asin) {

                cacheLinks[asin] =
                    dados.shortUrl;
                salvarCache();

                console.log(
                    "LINK CURTO: SALVO NO CACHE:",
                    asin
                );
            }

            return dados.shortUrl;
        }

        console.log(
            "LINK CURTO: AMAZON NÃO RETORNOU SHORTURL",
            dados
        );

        return longUrl;

    } catch (erro) {

        console.log(
            "LINK CURTO: ERRO:",
            erro.message
        );

        return longUrl;
    }
}