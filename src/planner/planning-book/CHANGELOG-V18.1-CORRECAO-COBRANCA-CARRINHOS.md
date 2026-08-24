# V18.1 - Correção crítica da cobrança de carrinhos

## Problema identificado

O motor podia exibir 3 carrinhos na estrutura e cobrar apenas 2 quando o terceiro carrinho era o de bebidas em consignação.

A causa estava em `calculateInvestment()`: a função reconstruía uma segunda contagem de carrinhos cobraveis e excluía grupos com itens em consignação. Assim, o carrinho de bebidas aparecia na estrutura, mas não entrava no valor-base do evento.

## Regra corrigida

- Todo carrinho presente na estrutura calculada por `calculateCarts()` é cobrado.
- Bebidas em consignação continuam fora do valor dos produtos no investimento inicial.
- O carrinho usado para servir as bebidas continua sendo estrutura Roda Festa e entra normalmente no valor-base.
- Horas adicionais também usam a mesma quantidade de carrinhos da estrutura.
- `calculateCarts().totalCarts` passa a ser a fonte única da quantidade usada na cobrança.

## Caso de regressão - Maysa RF-260824-00001

- Produtos não consignados: R$ 2.417,50
- Estrutura: 3 carrinhos
- Valor por carrinho / pacote de 4h: R$ 300,00
- Estrutura correta: R$ 900,00
- Investimento contratado correto: R$ 3.317,50
- Consignação das bebidas continua separada.

## Compatibilidade

O retorno legado `billableTotalCarts` foi mantido temporariamente como alias de `chargedTotalCarts` para evitar quebra de consumidores externos, embora a semântica correta agora seja "carrinhos cobrados = carrinhos da estrutura".
