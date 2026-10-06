import "dotenv/config";

const AMAZON_COOKIE =
    process.env.AMAZON_COOKIE;

const MARKETPLACE_ID =
    "526970";


export async function gerarLinkCurtoAmazon(
    longUrl
) {

    if (!longUrl) {
        return null;
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