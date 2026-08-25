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
