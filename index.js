import "dotenv/config";

import {
    buscarItemAmazon
} from "./amazon-api.js";

import {
    normalizarProdutoAmazon
} from "./amazon-normalizar.js";

import {
    formatarPostAmazon
} from "./amazon-post.js";

import {
    enviarPostAmazon,
    processarBotaoEnviarAmazon
} from "./telegram.js";

import {
    criarBannerAmazon
} from "./amazon-banner.js";

import {
    gerarLinkCurtoAmazon
} from "./amazon-link-curto.js";

const TOKEN =
    process.env.TELEGRAM_BOT_TOKEN;


let lastUpdateId = 0;


/*
 * Resolve links encurtados da Amazon.
 *
 * Exemplos:
 * amzn.to
 * amzlink.to
 * a.co
 * link.amazon
 */
async function normalizarLinkAmazon(
    url
) {
    if (
        url.includes("amzn.to") ||
        url.includes("amzlink.to") ||
        url.includes("a.co") ||
        url.includes("link.amazon")
    ) {
        const response =
            await fetch(
                url,
                {
                    redirect: "follow",

                    headers: {
                        "User-Agent":
                            "Mozilla/5.0"
                    },

                    signal:
                        AbortSignal.timeout(
                            45000
                        )
                }
            );

        url =
            response.url;
    }

    url =
        url
            .replace(
                /&amp;/gi,
                "&"
            )
            .replace(
                /\\&/g,
                "&"
            );

    return url;
}

/*
 * Extrai ASIN da URL já resolvida.
 */
function extrairAsin(
    url
) {
    const match =
        url.match(
            /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i
        );

    if (!match) {
        return null;
    }

    return match[1]
        .toUpperCase();
}

/*
 * Processa uma mensagem recebida
 * no Telegram.
 */
async function processarUpdateTelegram(
    update
) {

    const msg =
        update.message?.text ||
        update.message?.caption ||
        "";

    if (!msg) {
        return;
    }

    /*
     * Procura URLs dentro da mensagem.
     */
    const links =
        msg.match(
            /https?:\/\/[^\s]+/g
        );

    if (!links) {
        return;
    }

    /*
     * Pega o primeiro link
     * reconhecido como Amazon.
     */
    const linkOriginal =
        links.find(
            link =>
                link.includes("amazon") ||
                link.includes("amzn.to") ||
                link.includes("amzlink.to") ||
                link.includes("link.amazon") ||
                link.includes("a.co")
        );

    if (!linkOriginal) {
        return;
    }

    console.log(
        "\nLINK RECEBIDO:",
        linkOriginal
    );

    /*
     * Se for encurtado,
     * segue o redirect.
     */
    const link =
        await normalizarLinkAmazon(
            linkOriginal
        );

    console.log(
        "LINK RESOLVIDO:",
        link
    );

    /*
     * Extrai o ASIN.
     */
    const asin =
        extrairAsin(
            link
        );

    if (!asin) {
        console.log(
            "ASIN NÃO ENCONTRADO"
        );

        return;
    }

    console.log(
        "ASIN:",
        asin
    );

    /*
     * Daqui para baixo:
     * Creators API.
     */
    const item =
        await buscarItemAmazon(
            asin
        );

    if (!item) {
        console.log(
            "PRODUTO NÃO RETORNADO PELA API"
        );

        return;
    }

    const produto =
        normalizarProdutoAmazon(
            item
        );


    /**
     * Tenta gerar link curto oficial
     * da Amazon pelo SiteStripe.
     *
     * Se falhar, mantém o link afiliado
     * original.
     */
    produto.linkAfiliado =
        await gerarLinkCurtoAmazon(
            produto.linkAfiliado
        );


    console.log(
        "\nPRODUTO NORMALIZADO:\n"
    );

    console.dir(
        produto,
        {
            depth: null,
            colors: true
        }
    );

    const post =
        formatarPostAmazon(
            produto
        );

    console.log(
        "\nPOST:\n"
    );

    console.log(
        post
    );

    const banner =
        await criarBannerAmazon(
            produto.imagem
        );

    await enviarPostAmazon(
        produto,
        post,
        banner
    );

    console.log(
        "POST ENVIADO AO TELEGRAM"
    );
}

/*
 * Busca novas mensagens
 * do Telegram.
 */
async function ouvirTelegram() {

    const url =
        `https://api.telegram.org/bot${TOKEN}/getUpdates` +
        `?timeout=30&offset=${lastUpdateId + 1}`;

    const resposta =
        await fetch(
            url,
            {
                signal:
                    AbortSignal.timeout(
                        45000
                    )
            }
        );

    const dados =
        await resposta.json();

    if (!dados.ok) {

        throw new Error(
            dados.description ||
            "ERRO NO TELEGRAM"
        );
    }

    for (
        const update of
        dados.result || []
    ) {

        lastUpdateId =
            update.update_id;

        const tratouBotao =
            await processarBotaoEnviarAmazon(
                update
            );

        if (tratouBotao) {
            continue;
        }

        await processarUpdateTelegram(
            update
        );
    }
}


/*
 * Inicia o listener.
 */
(async () => {

    /*
     * Ignora mensagens antigas
     * que já estavam pendentes
     * antes do bot iniciar.
     */
    const respostaInicial =
        await fetch(
            `https://api.telegram.org/bot${TOKEN}/getUpdates`
        );


    const dadosIniciais =
        await respostaInicial.json();


    if (
        dadosIniciais
            .result
            ?.length
    ) {

        lastUpdateId =
            dadosIniciais
                .result[
                dadosIniciais.result.length - 1
            ]
                .update_id;
    }


    console.log(
        "BOT ESCUTANDO TELEGRAM..."
    );


    while (true) {

        try {

            await ouvirTelegram();

        } catch (erro) {

            console.error(
                "ERRO NO LISTENER:",
                erro.message
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        1000
                    )
            );
        }
    }

})();