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

    const LIMITE_TITULO = 90;

    if (titulo.length > LIMITE_TITULO) {
        titulo = titulo
            .slice(0, LIMITE_TITULO - 3)
            .replace(/\s+\S*$/, "")
            .trim() + "...";
    }

    const temPreco =
        produto.precoAtual !== null &&
        produto.precoAtual !== undefined;


    const textoRecorrencia =
        produto.ehRecorrencia
            ? " - na recorrência"
            : "";


    const linhaPreco =
        temPreco
            ? `✅ <b>R$${formatarPreco(produto.precoAtual)}</b>${textoRecorrencia}\n`
            : "";


    return (
        `${titulo}\n\n` +

        linhaPreco +

        `🔎 ${produto.linkAfiliado}\n\n` +

        `anúncio - preço sujeito a alteração`
    );
}