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

    /*
    * ORDEM DE PRECEDÊNCIA:
    *
    * 1. preço de oferta / deal
    * 2. recorrência
    * 3. preço normal
    */

    const oferta =
        listings.find(
            listing =>
                listing?.dealDetails &&
                listing
                    ?.price
                    ?.money
                    ?.amount != null
        );

    const recorrencia =
        listings.find(
            listing =>
                listing.type ===
                "SUBSCRIBE_AND_SAVE" &&
                listing
                    ?.price
                    ?.money
                    ?.amount != null
        );

    const principal =
        listings.find(
            listing =>
                listing
                    ?.price
                    ?.money
                    ?.amount != null
        );

    const escolhida =
        oferta ||
        recorrencia ||
        principal;

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
            escolhida === recorrencia,

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