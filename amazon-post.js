function formatarPreco(valor) {
    return Number(valor)
        .toFixed(2)
        .replace(".", ",");
}


export function formatarPostAmazon(produto) {

    if (!produto) {
        throw new Error(
            "PRODUTO NÃO INFORMADO"
        );
    }

    if (!produto.titulo) {
        throw new Error(
            "PRODUTO SEM TÍTULO"
        );
    }

    if (
        produto.precoAtual === null ||
        produto.precoAtual === undefined
    ) {
        throw new Error(
            "PRODUTO SEM PREÇO"
        );
    }


    let titulo =
        produto.titulo;


    /*
     * Se houver quantidade mínima,
     * apenas informa no título.
     *
     * NÃO calcula preço por unidade.
     */
    if (
        produto.quantidadeMinima > 1
    ) {
        titulo =
            `${produto.quantidadeMinima}x - ${titulo}`;
    }


    const preco =
        formatarPreco(
            produto.precoAtual
        );


    const textoRecorrencia =
        produto.ehRecorrencia
            ? " - na recorrência"
            : "";


    return (
        `${titulo}\n\n` +

        `✅ <b>R$${preco}</b>${textoRecorrencia}\n\n` +

        `<b>🔎 ${produto.linkAfiliado}</b>\n\n` +

        `#Anúncio`
    );
}