# Roda Festa - ROADMAP técnico do Planner, Admin e Motor

## Norte do projeto

Construir uma plataforma segura, rastreável e simples para cliente e proprietárias, em que recomendação, preço, proposta, PDF, Admin e aprendizado compartilhem uma única fonte de verdade.

Layout e refinamento visual permanecem importantes, mas entram depois da fundação comercial, histórica e de segurança.

## Fase 0 - Base segura V19.5

**Estado:** concluída como checkpoint de 24/08/2026, com QA mobile ainda parcial.

- mobile-first uma etapa por tela;
- personalização completa restaurada;
- correção de carrinhos preservada;
- build/lint verdes;
- snapshot seguro `1a8c44e`;
- findings/governança estabelecidos.

## Fase 1 - Verdade comercial e regressão automatizada

**Estado:** fundação técnica concluída em 25/08/2026; expansão da matriz permanece em andamento.

### Entregas desta unidade

- [x] criar `CommercialLedger` discriminado;
- [x] derivar o total da soma do ledger;
- [x] criar reconciliação diferença zero;
- [x] versionar recomendador, regras comerciais e tabela de preço;
- [x] congelar recomendação original no fluxo atual;
- [x] derivar delta recomendação x final no snapshot;
- [x] recalcular submissão no servidor usando catálogo confiável;
- [x] rejeitar preço/total/carrinhos adulterados;
- [x] criar suíte `npm test` / `npm run test:commercial`;
- [x] executar e validar suíte completa no Windows da usuária antes do commit técnico;
- [ ] expandir matriz para todos os produtos e combinações críticas.

### Checkpoint da Fase 1

- commit técnico: `c0f69ec134a7a2d7d698241959274d4cb3ece071`;
- 11/11 testes automatizados verdes;
- lint verde;
- build verde;
- próxima prioridade: Fase 2, PlanningSession server-side e persistência durável.

### Critério de saída

- build verde;
- lint verde;
- testes comerciais verdes;
- RF-001 coberto permanentemente por teste;
- nenhum total oficial depender de preço fornecido pelo navegador.

## Fase 2 - Persistência e identidade de jornada

### Objetivo

Substituir `localStorage`/e-mail como pseudo-histórico por persistência durável.

### Entregas

- modelar `PlanningSession`;
- criar sessão anônima server-side;
- cookie/token seguro;
- `InputSnapshot`;
- `RecommendationSnapshot` persistido;
- `PlanningChange` persistido;
- `FinalProposalSnapshot` persistido;
- vínculo opcional com contato por telefone/e-mail;
- status de jornada/evento;
- estratégia de backup e retenção.

### Critério de saída

Fechar/reabrir navegador não pode apagar a verdade comercial; Admin deve conseguir consultar proposta pelo backend.

## Fase 3 - Event log e histórico explicável

- registrar eventos relevantes com ator `CLIENT/ENGINE/ADMIN/SYSTEM`;
- quantidade antes/depois;
- inclusão/remoção/troca;
- mudanças de convidados/duração/serviços;
- timestamps;
- motivos quando disponíveis;
- timeline consultável.

## Fase 4 - Tabela comercial versionada

- cadastro canônico de produtos/serviços;
- histórico de preços;
- vigência;
- alteração fácil para `OWNER`;
- auditoria de quem alterou;
- proposta histórica preserva preço aplicado;
- mecanismo de publicação de nova tabela.

## Fase 5 - PDF canônico e evidência interna

**P0 existente RF-022.**

- gerar PDF no sistema a partir de `FinalProposalSnapshot`;
- gerar um único artefato;
- hash criptográfico;
- persistência durável;
- oferecer exatamente o mesmo arquivo à cliente;
- Admin acessa exatamente a mesma via;
- falha de persistência não pode ser silenciosa.

## Fase 6 - Autenticação e Central Admin

### Segurança antes da UI

- autenticação;
- autorização server-side;
- sessão segura;
- CSRF em mutações;
- rate limiting;
- audit log;
- perfis preparados (`OWNER`, `COMMERCIAL`, `OPERATION`).

### Telas

- Dashboard;
- Agenda;
- Busca cliente/evento/código;
- Ficha completa;
- Sugestão original x alterações x final;
- Reconciliação financeira discriminada;
- PDF canônico;
- Tabela comercial;
- Pós-evento;
- Saúde do motor.

## Fase 7 - Pós-evento e base real de aprendizado

Quando esta fase iniciar, solicitar à proprietária os dados reais das festas disponíveis.

- registrar falta/sobra/ideal por item/categoria;
- separar preferência de erro de recomendação;
- consolidar dataset real;
- nunca inventar dado ausente.

## Fase 8 - Recomendador versionado orientado por evidência

- manter baseline atual como `RF-REC-1.0.0`;
- criar versões candidatas;
- executar backtest contra eventos históricos;
- comparar sugestão antiga/candidata/final/resultado;
- aprovar manualmente promoção;
- monitorar comportamento após promoção.

## Fase 9 - Segurança e robustez ampliadas

- tratar dependências vulneráveis de forma controlada;
- proteção anti-bot/abuso;
- idempotência/replay protection em finalização;
- limites rigorosos de payload;
- observabilidade;
- políticas de dados pessoais;
- testes de autorização/Admin;
- recuperação/backup.

## Fase 10 - Limpeza arquitetural

Somente após comprovar não uso:

- mapear Planner legado;
- remover `.bak`, sandboxes e duplicações;
- eliminar CSS/imports mortos;
- reduzir bundle;
- preservar documentação histórica.

## Fase 11 - Refinamento visual

Depois da fundação:

- homologar welcome clássico;
- punch visual Roda Festa;
- refinamento das páginas mobile;
- UX do Admin;
- acessibilidade;
- estados vazios/erro/carregamento;
- navegação final com testes reais.

## Regras de execução

1. unidade pequena e testável;
2. finding antes/junto de bug importante;
3. teste de regressão para bug comercial;
4. commit técnico;
5. reconciliação documental com hash;
6. commit documental;
7. working tree limpa;
8. snapshot somente depois.

## Checkpoint parcial da Fase 2 - V19.7A (25/08/2026)

**Estado:** fundacao de persistencia desacoplada concluida; persistencia duravel de producao ainda nao ativada.

Entregue:

- [x] contrato provider-agnostic de repositorio de `PlanningSession`;
- [x] adapter em memoria exclusivo para testes/controlabilidade;
- [x] adapter Supabase isolado e fail-high quando nao configurado;
- [x] token anonimo de alta entropia e persistencia somente de hash;
- [x] ownership por `sessionId + tokenHash`;
- [x] propriedades de cookie seguro;
- [x] validacao de origem para mutacoes;
- [x] controle de versao/concorrencia e bloqueio de segunda finalizacao divergente;
- [x] migration PostgreSQL/Supabase versionada;
- [x] 20/20 testes verdes, lint verde e build verde no Windows oficial;
- [x] isolamento explicito: nenhuma infraestrutura do Simplify e alterada para viabilizar o Roda Festa.

Ainda pendente para concluir a Fase 2:

- [ ] integrar criacao/recuperacao de PlanningSession ao fluxo real do Planner;
- [ ] persistir InputSnapshot, RecommendationSnapshot, mudancas e FinalProposalSnapshot por backend;
- [ ] ativar infraestrutura duravel propria do Roda Festa;
- [ ] aplicar migration somente apos aprovacao explicita da infraestrutura;
- [ ] definir backup, retencao e recuperacao;
- [ ] provar fechamento/reabertura sem perda da verdade comercial;
- [ ] disponibilizar consulta backend para o futuro Admin.

**Checkpoint tecnico:** `452be928190ad66b924a710f12d98d2b1a6f3964`.

## Checkpoint parcial da Fase 3 - V19.7C (25/08/2026)

**Estado:** fundação de timeline explicável concluída; consulta persistida de produção ainda depende da ativação futura da infraestrutura própria do Roda Festa.

Entregue:

- [x] `PlanningChange` append-only;
- [x] ator normalizado no servidor;
- [x] timestamp normalizado no servidor;
- [x] ordem preservada;
- [x] ownership por sessão/token;
- [x] batch de mudanças com versão otimista;
- [x] rejeição de tipo/produto inválido;
- [x] bloqueio de novas mudanças após finalização;
- [x] 38/38 testes verdes;
- [x] lint verde;
- [x] build verde com 126 módulos;
- [x] migration mantida somente como artefato versionado, sem execução.

Próximo passo recomendado:

- [ ] construir projeção de leitura da jornada: entrada, recomendação, timeline e final;
- [ ] garantir que a leitura não recalcule fatos históricos;
- [ ] preparar contrato de consulta para o futuro Admin;
- [ ] manter persistência remota desligada até infraestrutura própria ser aprovada.

**Checkpoint técnico:** `a9e6bf89e1e8799a0d9625a9e2731a624f4c447b`.

## Checkpoint concluído — V19.7D Journey Read Model

Status: **concluído** no commit `ce536b4ec42824eb904fdb4fcfb1353c4a2105eb`.

Entregue:
- reconstrução explicável da jornada;
- leitura de entrada, recomendação, timeline e proposta final;
- ownership na leitura;
- integração client/API/repository;
- compatibilidade entre shape persistido e normalizado;
- regressões específicas para integridade e segurança;
- baseline final 44/44 + lint + build.

A persistência remota continua deliberadamente desligada e nenhuma migration foi executada. A próxima unidade deve partir deste checkpoint limpo, sem antecipar ativação de infraestrutura.

## Checkpoint concluído — V19.7E Admin Journey Query

Status: **concluído** no commit `2852f946e2f9430afdc247f093ba2c421c035ecb`.

Entregue o contrato de leitura preparado para a futura Central Admin: resumo comercial, status, histórico, reconciliação e detalhe explicável com snapshots.

Próximo limite arquitetural: qualquer consulta administrativa global deverá nascer somente depois de uma fronteira explícita de autenticação/autorização. Persistência remota permanece desligada.

## Checkpoint concluído — V19.7F Admin Authorization Boundary

Status: **concluído** no commit `58bba0cb009d2823efa65d615fe9799990e74924`.

Entregue:
- principal administrativo normalizado;
- autorização fail-closed;
- roles explícitas;
- capabilities por operação;
- bloqueio de conta inativa;
- boundary reutilizável para futuras APIs Admin;
- 55/55 testes, lint e build verdes.

Próximo passo recomendado: conectar uma autenticação Admin real a essa boundary antes de expor consultas administrativas globais. A implementação deverá preservar o princípio de mínimo privilégio e não depender da infraestrutura do Simplify.
