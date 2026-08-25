# V19.7B - PlanningSession Flow Integration

## Objetivo

Ligar a fundacao provider-agnostic de PlanningSession ao fluxo real do Planner sem ativar persistencia remota por padrao e sem alterar a experiencia atual quando o recurso estiver desligado.

## Entregas

- endpoint server-side `/api/planning-sessions` com acoes `start` e `finalize`;
- recomendacao original reconstruida no servidor a partir das entradas, sem confiar em snapshot de recomendacao enviado pelo navegador;
- cookie anonimo HttpOnly gerenciado apenas pelo servidor;
- finalizacao usa a recomendacao persistida como referencia para calcular o delta;
- proposta final e recalculada pelo servidor antes de persistencia;
- integracao do Planner protegida por `VITE_PLANNING_SESSION_PERSISTENCE_ENABLED=true`;
- com flag desligada, fluxo atual permanece inalterado;
- com flag ligada, falha de sessao/persistencia bloqueia a finalizacao em vez de cair silenciosamente para pseudo-persistencia;
- provider server-side permanece `disabled` por padrao; nenhuma migration e executada.

## Seguranca

Nenhum secret e exposto ao navegador. O frontend recebe apenas `sessionId` e `version`; o token de posse permanece em cookie HttpOnly.

## Hardening adicional antes de ativacao

- corrigida a modelagem do token: o mesmo cookie anonimo pode possuir varias jornadas; `anonymous_session_token_hash` deixa de ser `UNIQUE` e passa a ser indexado;
- `client_request_id` permanece unico para idempotencia;
- adapter em memoria replica a mesma semantica do banco;
- adapter Supabase trata retry de finalizacao da mesma proposta como idempotente;
- finalizacao rejeita divergencia de contexto (data, tipo de evento, convidados, duracao e contato) em relacao a sessao que originou a recomendacao.
