import "dotenv/config";

const CLIENT_ID =
    process.env.AMAZON_CLIENT_ID;

const CLIENT_SECRET =
    process.env.AMAZON_CLIENT_SECRET;

const PARTNER_TAG =
    process.env.AMAZON_PARTNER_TAG;


let tokenAtual = null;
let tokenExpiraEm = 0;


async function obterToken() {

    if (
        tokenAtual &&
        Date.now() < tokenExpiraEm
    ) {
        return tokenAtual;
    }

    const resposta = await fetch(
        "https://api.amazon.com/auth/o2/token",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                grant_type:
                    "client_credentials",

                client_id:
                    CLIENT_ID,

                client_secret:
                    CLIENT_SECRET,

                scope:
                    "creatorsapi::default"
            })
        }
    );

    const dados =
        await resposta.json();

    if (!resposta.ok) {

        throw new Error(
            "ERRO AO GERAR TOKEN AMAZON: " +
            JSON.stringify(dados)
        );
    }

    tokenAtual =
        dados.access_token;

    tokenExpiraEm =
        Date.now() +
        (
            (dados.expires_in - 60) *
            1000
        );

    return tokenAtual;
}


export async function buscarItemAmazon(
    asin
) {

    const token =
        await obterToken();

    const resposta = await fetch(
        "https://creatorsapi.amazon/catalog/v1/getItems",
        {
            method: "POST",

            headers: {
                "Authorization":
                    `Bearer ${token}`,

                "Content-Type":
                    "application/json",

                "x-marketplace":
                    "www.amazon.com.br"
            },

            body: JSON.stringify({

                itemIds: [asin],

                itemIdType:
                    "ASIN",

                marketplace:
                    "www.amazon.com.br",

                partnerTag:
                    PARTNER_TAG,

                resources: [
                    "itemInfo.title",
                    "images.primary.large",
                    "offersV2.listings.availability",
                    "offersV2.listings.price",
                    "offersV2.listings.merchantInfo",
                    "offersV2.listings.type",
                    "offersV2.listings.dealDetails"
                ]
            })
        }
    );

    const dados =
        await resposta.json();

    if (!resposta.ok) {

        throw new Error(
            "ERRO AMAZON GETITEMS: " +
            JSON.stringify(dados)
        );
    }

    return (
        dados
            ?.itemsResult
            ?.items
        ?.[0] ??
        null
    );
}