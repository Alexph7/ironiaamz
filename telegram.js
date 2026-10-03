import "dotenv/config";

const BOT_TOKEN =
    process.env.TELEGRAM_BOT_TOKEN;

const CHAT_POST =
    process.env.TELEGRAM_CHAT_POST;

const CHAT_ALERTAS =
    process.env.TELEGRAM_CHAT_ALERTAS;


async function chamarTelegram(
    metodo,
    body
) {

    const resposta = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/${metodo}`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify(body)
        }
    );

    const dados =
        await resposta.json();

    if (!dados.ok) {
        throw new Error(
            `ERRO TELEGRAM: ${JSON.stringify(dados)}`
        );
    }

    return dados.result;
}

async function enviarFotoTelegram(
    chatId,
    buffer,
    legenda
) {

    const form =
        new FormData();


    form.append(
        "chat_id",
        chatId
    );

    form.append(
        "caption",
        legenda
    );

    form.append(
        "parse_mode",
        "HTML"
    );

    form.append(
        "reply_markup",
        JSON.stringify({
            inline_keyboard: [
                [
                    {
                        text: "Enviar",
                        callback_data:
                            "enviar_oferta"
                    }
                ]
            ]
        })
    );

    const blob =
        new Blob(
            [buffer],
            {
                type:
                    "image/jpeg"
            }
        );


    form.append(
        "photo",
        blob,
        "amazon.jpg"
    );


    const resposta =
        await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
            {
                method:
                    "POST",

                body:
                    form
            }
        );


    const dados =
        await resposta.json();


    if (!dados.ok) {

        throw new Error(
            `ERRO TELEGRAM FOTO: ${JSON.stringify(dados)}`
        );
    }

    return dados.result;
}

export async function enviarPostAmazon(
    produto,
    mensagem,
    banner
) {

    /*
     * Se houver imagem,
     * manda foto + texto.
     */
    if (banner) {

        return enviarFotoTelegram(
            CHAT_POST,
            banner,
            mensagem
        );
    }

    /*
     * Fallback sem imagem.
     */
    return chamarTelegram(
        "sendMessage",
        {
            chat_id:
                CHAT_POST,

            text:
                mensagem,

            parse_mode:
                "HTML",

            disable_web_page_preview:
                true,

            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Enviar",
                            callback_data:
                                "enviar_oferta"
                        }
                    ]
                ]
            }
        }
    );
}


export async function enviarAlertaAmazon(
    texto
) {

    return chamarTelegram(
        "sendMessage",
        {
            chat_id:
                CHAT_ALERTAS,

            text:
                texto,

            parse_mode:
                "HTML",

            disable_web_page_preview:
                true
        }
    );
}

export async function processarBotaoEnviarAmazon(
    update
) {
    const callback =
        update.callback_query;

    if (
        callback?.data !==
        "enviar_oferta"
    ) {
        return false;
    }

    const mensagem =
        callback.message;

    if (!mensagem) {
        return true;
    }

    try {

        const destino =
            process.env
                .TELEGRAM_CHAT_DESTINO;

        const resposta =
            await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/copyMessage`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            chat_id:
                                destino,

                            from_chat_id:
                                mensagem
                                    .chat
                                    .id,

                            message_id:
                                mensagem
                                    .message_id
                        }),

                    signal:
                        AbortSignal.timeout(
                            15000
                        )
                }
            );

        const dados =
            await resposta.json();

        if (!dados.ok) {
            throw new Error(
                dados.description ||
                "TELEGRAM NÃO COPIOU A OFERTA"
            );
        }


        /*
         * Confirma o clique.
         */
        await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        callback_query_id:
                            callback.id,

                        text:
                            "✅ Enviado!"
                    })
            }
        );


        /*
         * Remove o botão para
         * evitar envio duplicado.
         */
        await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        chat_id:
                            mensagem
                                .chat
                                .id,

                        message_id:
                            mensagem
                                .message_id,

                        reply_markup: {
                            inline_keyboard: []
                        }
                    })
            }
        );


        console.log(
            "OFERTA AMAZON ENVIADA PARA O CANAL DEFINITIVO"
        );

    } catch (erro) {

        console.error(
            "ERRO AO ENVIAR OFERTA AMAZON:",
            erro.message
        );


        await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        callback_query_id:
                            callback.id,

                        text:
                            "❌ Erro ao enviar",

                        show_alert:
                            true
                    })
            }
        ).catch(() => {});
    }

    return true;
}