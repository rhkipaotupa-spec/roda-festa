# RF-ADMIN-COMMERCIAL-V1

Branch de trabalho para integrar gestão de catálogo, edição administrativa auditável de pedidos e Brigadeiro no Tacho sem alterar `main` antes dos gates finais.

Estado inicial: `d6d52b18b9119b7bb724b97af661d3c6300e18e6`.

## Escopo integrado

- catálogo persistente e versionado;
- cadastro, edição, preço, lote, capacidade e desativação reversível de produtos;
- revisão administrativa de pedidos preservando a proposta original;
- Brigadeiro no Tacho: 80 g por convidado real, R$ 12 por porção, chocolate / Leite Ninho / meio a meio;
- carrinho exclusivo do tacho quando não há bebidas e compartilhado com bebidas quando houver;
- capacidade do tacho permanece explicitamente não medida (`null`) até evidência operacional;
- PlanningSession congela snapshot/fingerprint do catálogo usado no início da jornada;
- PlanningBook carrega o catálogo runtime antes de abrir o fluxo.

## Gate atual

A integração visual do Tacho no PlanningBook foi aplicada de forma fail-closed ao código-fonte em branch dedicada. A `main` e Production permanecem intactas.

Nenhum merge deve ocorrer antes de:

1. focused tests GREEN;
2. full suite GREEN;
3. lint GREEN;
4. build GREEN;
5. migration revisada/aplicada deliberadamente;
6. smoke real de catálogo + edição de pedido + tacho.
