# V19.8A — Admin Quotes Read Surface

Base obrigatória: `ccecb934d51ead97e563d02a33bad839e85eb081`.

## Objetivo

Transformar o `/admin` em ambiente real de trabalho, visualmente coerente com o Planning Book, começando por leitura segura dos orçamentos persistidos.

## Entregas

- login redesenhado na linguagem visual do Planning Book;
- workspace administrativo após autenticação;
- endpoint protegido `GET /api/admin-quotes`;
- listagem server-side de `planning_sessions`;
- detalhe read-only de um orçamento;
- uso de `buildAdminJourneySummary()` e `buildAdminJourneyDetail()`;
- service-role permanece somente no servidor;
- navegador não recebe token anônimo/hash do cliente;
- leitura visual de `Sugestão → alterações → versão validada`;
- CTA `Novo orçamento` levando ao Planning Book em contexto administrativo;
- layout desktop e mobile.

## Limites desta unidade

- ainda não altera orçamentos pelo Admin;
- ainda não arquiva/desarquiva;
- ainda não implementa calibração automática do motor;
- o retorno explícito do Planning para o Admin será conectado em unidade subsequente, após validar esta primeira superfície real;
- a calibração futura deve usar exemplos aprovados e preservar a sugestão original.
