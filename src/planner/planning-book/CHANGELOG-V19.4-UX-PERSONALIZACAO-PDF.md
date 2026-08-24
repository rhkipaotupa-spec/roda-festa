# V19.4 - UX, personalização completa e PDF

## Objetivo

Preservar a arquitetura mobile-first de uma etapa por tela, recuperando a identidade premium de caderno Roda Festa e restaurando capacidades de personalização que haviam regredido na V19.

## Alterações

- header vinho com logo creme e identidade "Meu Planner";
- papel com linhas discretas, profundidade, dourado e hierarquia editorial;
- todas as categorias do cardápio iniciam recolhidas;
- aviso destacado quando um campo obrigatório impede o avanço;
- personalização completa da recomendação: quantidade, trocar sabor, retirar item, adicionar item, retirar categoria e adicionar categoria;
- estrutura e investimento recalculados após cada alteração;
- PDF passa a abrir por Blob URL para evitar aba `about:blank` vazia;
- stack tipográfica local ajustada para títulos e interface;
- FINDINGS, WORKLOG e DECISIONS reconciliados com o QA visual de 24/08/2026.

## Validação necessária antes de commit

- `npm run build`;
- `npm run lint`;
- smoke do motor 1/2/3 carrinhos + hora adicional;
- smoke visual da jornada completa;
- PDF em Chrome desktop, Chrome Android e Safari iPhone;
- edição completa da recomendação sem divergência entre visual, resumo e investimento.
