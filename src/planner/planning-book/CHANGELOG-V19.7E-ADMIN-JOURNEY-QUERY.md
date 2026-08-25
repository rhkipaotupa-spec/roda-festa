# V19.7E — Admin Journey Query

Unidade incremental sobre o checkpoint documental `13a93431d23fefc41b30f9ca3c0b3284139a2ae7`.

Objetivo: criar um contrato de leitura derivado do Journey Read Model para a futura Central Admin, sem ativar persistência remota e sem executar migrations.

Entregue nesta unidade:
- `buildAdminJourneySummary`: resumo de sessão/evento, situação, totais e histórico;
- `buildAdminJourneyDetail`: visão explicável com snapshots;
- reconciliação comercial transportada como fato, sem novo cálculo;
- isolamento por clone para impedir mutação do histórico;
- testes de regressão específicos.

Esta unidade deliberadamente NÃO cria listagem global de sessões nem endpoint administrativo sem autenticação/autorização administrativa definida. A consulta agregada futura deverá ser implementada atrás de uma fronteira de autorização explícita.
