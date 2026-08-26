# V19.8C — Planning Brown Theme

Base obrigatória: `6939a37eb953e8c1d2973f757a5f10e0b35afa25`.

## Objetivo

Levar o fluxo interno do Planning Book para a mesma identidade visual marrom escuro + creme + dourado aprovada no Admin, sem alterar comportamento, motor ou persistência.

## Entregas

- tokens primários do Planning passam de vinho para marrom;
- header do fluxo, progresso, estados selecionados e controles que usam `--rf-wine` herdam o novo marrom;
- welcome recebe gradiente marrom explícito;
- botões primários recebem gradiente marrom;
- foco e seleção deixam de usar sombra avermelhada;
- barra `Modo administrativo` permanece preservada.

## Não altera

- motor de sugestão;
- endpoints;
- persistência de `planning_sessions`;
- navegação Admin ↔ Planning;
- proteção do Preview da Vercel no celular.
