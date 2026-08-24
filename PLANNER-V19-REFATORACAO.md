# Roda Festa Planner V19 — mobile-first por etapas

## Objetivo

O site institucional foi preservado. A V19 refatora apenas `/planning-book` para uma jornada de uma tela por etapa, desenhada primeiro para celular.

## Fluxo

1. Welcome
2. Informações do evento
3. Escolha do cardápio
4. Recomendação e ajustes
5. Validação final
6. Conclusão / PDF / WhatsApp

Nenhuma etapa exibe visualmente a página anterior ao lado.

## Regras preservadas

- crianças 7+ contam como 1 adulto equivalente;
- crianças 0–6 contam como 0,5 adulto equivalente;
- carrinhos, equipe, horas extras e investimento usam a mesma estrutura calculada;
- bebidas permanecem em consignação, mas o carrinho de bebidas continua cobrado como estrutura;
- PDF é criado a partir de um snapshot final do planejamento.

## Preços atualizados — porção 150 g

- Cebola caramelizada com queijo: R$ 7,00
- Strogonoff de frango: R$ 7,00
- Frango com catupiry: R$ 7,00
- Frango com cream cheese e ervas: R$ 7,00
- Palmito com catupiry: R$ 9,00
- Camarão com catupiry: R$ 15,00
- Carne louca com cheddar: R$ 15,00
- Bacalhau com catupiry: R$ 15,00

## Via interna da proposta

A conclusão salva o snapshot no navegador e tenta enviá-lo para `/api/planning-submissions`.

Na Vercel, configurar de forma segura (Project Settings > Environment Variables):

- `RESEND_API_KEY`
- `RODA_FESTA_PROPOSAL_EMAIL`
- `RODA_FESTA_FROM_EMAIL` (opcional; recomendado usar domínio validado)

Não colocar chaves no código-fonte nem enviar secrets por chat.

O e-mail interno é gerado do mesmo snapshot do PDF, preservando preços, quantidades, estrutura e total da proposta.
