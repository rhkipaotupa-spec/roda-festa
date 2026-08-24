# V18.0 — Mobile Responsive Foundation

Esta revisão reorganiza a experiência mobile sem alterar o motor de cálculo, regras comerciais ou conteúdo do planejamento.

## Objetivos

- Tratar celular como uma experiência própria, e não como desktop apenas reduzido.
- Preservar integralmente o layout desktop acima de 760 px.
- Melhorar leitura, toque, formulários, navegação e visualização em telas pequenas.

## Principais ajustes

- Livro convertido em fluxo vertical confortável no celular.
- Padding horizontal unificado e adaptável por largura de tela.
- Inputs com 16 px para evitar zoom automático no iPhone.
- Áreas de toque de aproximadamente 44–52 px nos controles principais.
- Header reorganizado para evitar cards espremidos.
- Barra de progresso horizontal com scroll suave e snap.
- Cards operacionais convertidos para uma coluna no mobile.
- Controles de quantidade ampliados e reorganizados.
- Seleção de cardápio em coluna única e botões de expansão em largura total.
- CTAs e navegação inferior em largura total.
- Cena visual separada do texto no mobile, evitando colisões de overlay.
- Modal de adição transformado em bottom sheet.
- Tela de conclusão otimizada para ocupar a largura total do celular.
- Ajustes adicionais para 480 px, 360 px e orientação paisagem.

## Arquivos alterados

- `PlanningBook.css`
- `CHANGELOG-V18.0-MOBILE-RESPONSIVE.md`

Nenhuma alteração foi feita em `PlanningBook.jsx`, no motor (`engine`) ou na navegação.
