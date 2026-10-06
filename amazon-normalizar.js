export function normalizarProdutoAmazon(
    item
) {

    if (!item) {
        return null;
    }

    const listings =
        item
            ?.offersV2
            ?.listings ??
        [];

    /**
     * Escolhe a listing com o menor preço
     * entre todas as retornadas pela Amazon.
     */
    const listingsComPreco =
        listings.filter(
            listing => {
                const valor =
                    Number(
                        listing
                            ?.price
                            ?.money
                            ?.amount
                    );

                return Number.isFinite(valor);
            }
        );
    const escolhida =
        listingsComPreco.reduce(
            (menor, listing) => {

                if (!menor) {
                    return listing;
                }

                const precoMenor =
                    Number(
                        menor
                            ?.price
                            ?.money
                            ?.amount
                    );

                const precoAtual =
                    Number(
                        listing
                            ?.price
                            ?.money
                            ?.amount
                    );

                return precoAtual < precoMenor
                    ? listing
                    : menor;
            },
            null
        );

    const precoAtual =
        escolhida
            ?.price
            ?.money
            ?.amount ??
        null;

    const quantidadeMinima =
        escolhida
            ?.availability
            ?.minOrderQuantity ??
        1;

    const disponibilidade =
        escolhida
            ?.availability
            ?.type ??
        null;

    return {

        asin:
            item.asin ??
            null,

        titulo:
            item
                ?.itemInfo
                ?.title
                ?.displayValue ??
            null,

        imagem:
            item
                ?.images
                ?.primary
                ?.large
                ?.url ??
            null,

        linkAfiliado:
            item.asin
                ? `https://www.amazon.com.br/dp/${item.asin}?tag=cupomferta-20`
                : null,

        precoAtual:
            precoAtual != null
                ? Number(precoAtual)
                : null,

        ehRecorrencia:
            escolhida?.type ===
            "SUBSCRIBE_AND_SAVE",

        quantidadeMinima:
            quantidadeMinima,

        vendedorNome:
            escolhida
                ?.merchantInfo
                ?.name ??
            null,

        disponivel:
            disponibilidade ===
            "IN_STOCK",

        tipoOferta:
            escolhida
                ?.dealDetails
                ?.accessType ??
            null,

        badgeOferta:
            escolhida
                ?.dealDetails
                ?.badge ??
            null
    };
}