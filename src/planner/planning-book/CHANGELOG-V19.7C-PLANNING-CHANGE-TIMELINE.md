# V19.7C - PlanningChange / Timeline Explicavel

## Objetivo
Registrar alteracoes comercialmente relevantes da jornada sem transformar cliques de interface em historico e sem tornar o cliente autoridade financeira.

## Entregas
- endpoint `changes` na API de PlanningSession;
- eventos normalizados no servidor com `id`, `actor=CLIENT` e `recordedAt`;
- append-only com optimistic locking por `version`;
- ownership por sessao + token hash;
- bloqueio de eventos apos finalizacao;
- fila serializada no Planner para manter a ordem e a versao;
- eventos para quantidade, item, troca, categoria e servicos opcionais;
- persistencia continua desligada por padrao; migration continua nao executada.

## Regra de confianca
A timeline descreve a jornada. Preco, estrutura e total continuam sendo recalculados pelo servidor no snapshot final.
