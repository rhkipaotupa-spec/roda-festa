# V19.7A - Persistence Abstraction (fundacao inativa)

## Decisao
A infraestrutura do Roda Festa nao sera destravada pausando, removendo ou alterando projetos do Simplify.

Esta unidade introduz somente a fundacao desacoplada de persistencia. Nao ativa PlanningSession no fluxo do cliente e nao executa migracao.

## Entregas
- contrato `PlanningSessionRepository` independente de provedor;
- adapter em memoria exclusivo para testes controlados;
- adapter Supabase/PostgREST isolado da regra de negocio;
- seguranca de token anonimo preparada;
- migration SQL versionada, mas inativa;
- testes de idempotencia, isolamento de posse, concorrencia e imutabilidade por copia;
- nenhuma alteracao em `PlanningBook.jsx` ou `planning-submissions.js` nesta unidade.

## Invariante
Aplicar esta unidade nao pode mudar o comportamento comercial atual do Planner.
