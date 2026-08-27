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

## Checkpoint concluído — V19.7G Admin Authentication Contract

Status: **concluído** no commit `2e08ee32042de8cd5614091a49371975b7761c37`.

Entregue:
- contrato provider-agnostic de autenticação administrativa;
- resolução server-side de sessão;
- principal administrativo confiável;
- rejeição de expiração/TTL inválido;
- contrato seguro de cookie;
- composição com a Authorization Boundary;
- 63/63 testes, lint e build verdes.

Próximo passo recomendado: integrar um mecanismo real de autenticação/sessão administrativa ao contrato, mantendo secrets fora do repositório e sem expor ainda consultas administrativas globais até que a integração esteja protegida e testada.

## Checkpoint concluído — V19.7H Admin Session Repository

Status: **concluído** no commit `eb1713d82f937ceaf0dbe94f736336cff3a8e135`.

Entregue:
- repository provider-agnostic de sessão administrativa;
- token opaco e armazenamento somente de hash;
- resolução segura;
- expiração server-side;
- revogação;
- rotação;
- adapter de memória restrito a testes;
- 72/72 testes, lint e build verdes.

Próximo passo recomendado: conectar o Admin Authentication Contract ao Admin Session Repository por uma composição server-side, ainda sem login visual e sem endpoint administrativo global.

## Checkpoint concluído — V19.7I Admin Authentication Composition

Status: **concluído** no commit `b9b847c0ebf117451ae25a2aa2e1309ccd505d8c`.

Entregue:
- composição server-side de Authentication Contract + Session Repository + Authorization Boundary;
- fail-closed de autenticação e autorização;
- proteção contra role/capability forjada no cliente;
- revogação, expiração e rotação respeitadas de ponta a ponta;
- não exposição de token/tokenHash;
- 82/82 testes, lint e build verdes.

Próximo passo recomendado: construir a superfície HTTP mínima de autenticação administrativa (login/logout/session refresh) atrás desta composição, sem expor ainda consultas administrativas globais e sem ativar persistência remota antes da infraestrutura própria estar aprovada.

## Checkpoint concluído — V19.7J Admin Authentication HTTP Boundary

Status: **concluído** no commit `3334f7444650b2d93001e1f7d9bd75ec0251d0ef`.

Entregue:
- login/logout/refresh HTTP server-side;
- verifier de credencial injetado;
- proteção de Origin;
- métodos POST-only;
- cookie administrativo seguro;
- revogação no logout;
- rotação no refresh;
- proteção contra role/capability forjada;
- não exposição de token/tokenHash/credential;
- 92/92 testes, lint e build verdes.

Próximo passo recomendado: criar a primeira experiência visual de login Admin sobre esta boundary HTTP, ainda sem abrir consultas administrativas globais e sem ativar persistência remota.

## Checkpoint concluído — V19.7K Admin Login Shell

Status: **concluído** no commit `5381ffc5de873781b6e976de53537b98190837ca`.

Entregue:
- primeira rota visual `/admin`;
- login shell mobile-first;
- campos de e-mail e senha;
- comportamento deliberadamente não autenticado;
- isolamento das rotas públicas;
- 96/96 testes, lint e build verdes;
- validação manual real em iPhone.

Dívida visual registrada:
- substituir placeholder `RF` pelo logo/branding oficial;
- realizar refinamento visual posteriormente.

Próxima direção: conectar progressivamente o shell à fundação de autenticação já construída, sem inserir credenciais fixas no frontend e sem antecipar abertura de consultas administrativas globais.

## Checkpoint concluído — V19.7L Admin Credential Verification Contract

Status: **concluído** no commit `4103e39b99b36bce9381a6d1a590a772cb90533d`.

Entregue:
- verifier server-side de credenciais;
- `scrypt` + salt;
- lookup confiável injetado;
- bloqueio de conta inativa;
- resposta neutra para usuário inexistente/senha incorreta;
- identidade derivada apenas do registro confiável;
- não exposição de hash/salt/credential;
- 106/106 testes, lint e build verdes.

Próximo passo recomendado: compor este verifier com a HTTP Boundary já criada e preparar a ligação do formulário `/admin` a um fluxo real de login sem inserir credenciais fixas no frontend.

## Checkpoint concluído — V19.7M Admin Login Composition

Status: **concluído** no commit `0b474af7a12871fa56dcd01a1da71056b0fa773e`.

Entregue:
- composição server-side do login Admin;
- verifier confiável injetado pela composição;
- proteção contra substituição do verifier pelo cliente;
- integração explícita com a HTTP Boundary;
- não exposição de dependências internas;
- 111/111 testes, lint e build verdes.

Próximo passo recomendado: expor uma rota controlada que use esta composição e, somente depois, ligar o formulário `/admin` a esse endpoint sem inserir credenciais fixas no frontend.

## Checkpoint concluído — V19.7M1 Real Boundary Composition Fix

Status: **concluído** no commit `7f43a827e5ead6e63d10022412e08130ddfb479b`.

Entregue:
- correção da interface entre Admin Login Composition e HTTP Boundary real;
- injeção correta do verifier na construção da boundary;
- teste de integração real ponta a ponta até emissão e resolução do cookie;
- proteção preservada contra credencial incorreta e Origin não confiável;
- 114/114 testes, lint e build verdes.

Próximo passo: retomar a V19.7N — criar o primeiro endpoint HTTP controlado de login Admin sobre esta composição já comprovada.

## Checkpoint concluído — V19.7N Admin Login HTTP Endpoint

Status: **concluído** no commit `640100e906652d98c725ac1e9d13ba48842062ed`.

Entregue:
- primeira porta HTTP concreta de login Admin;
- adaptação request/response para a composição já validada;
- transporte seguro de cookie;
- respostas públicas controladas;
- fail-closed padrão em 503;
- 121/121 testes, lint e build verdes.

Próximo passo: wiring server-side do runtime real de login Admin, sem embutir credenciais ou secrets no Git. Somente depois conectar o `AdminLogin.jsx` ao endpoint.

## Checkpoint concluído — V19.7O Vercel API Routing Boundary

Status: **concluído** no commit `bbd9ddf422822890d296216e33b12223b606760f`.

Entregue:
- preservação explícita do namespace `/api/*`;
- fallback SPA mantido em ordem segura;
- testes contra regressão de roteamento;
- 124/124 testes, lint e build verdes.

Próximo passo: wiring server-side do runtime real do login Admin, agora sobre uma topologia de deploy que preserva a API. Continuar sem credenciais ou secrets versionados.

## Checkpoint concluído — V19.7P Admin Supabase Persistence Adapters

Status: **concluído** no commit `8db1e991f62329da29fc580ec79d5a776c9d241b`.

Entregue:
- persistência server-side de identidade Admin via Supabase;
- persistência server-side de sessões Admin via Supabase;
- token bruto fora do storage;
- fail-high sem configuração;
- erros sanitizados;
- 136/136 testes, lint e build verdes.

Próximo passo: compor estes adapters em um runtime Admin real, ainda sem criar usuário/senha real ou versionar secrets.

## Checkpoint concluído — V19.7Q Admin Runtime Composition

Status: **concluído** no commit `ea839646658293301b812006dff7adc5a6438329`.

Entregue:
- runtime Admin persistente composto server-side;
- fail-high sem configuração persistente;
- nenhum fallback de memória;
- service-role fora do objeto público;
- login integrado ponta a ponta em teste;
- 142/142 testes, lint e build verdes.

Próximo passo: ligar `api/admin-login.js` ao runtime persistente de forma fail-closed quando configuração/tabelas ainda não estiverem disponíveis, ainda sem criar credenciais reais no Git.

## Checkpoint concluído — V19.7R Admin Login Runtime Wiring

Status: **concluído** no commit `ff5f597dd40ed6f31a95d99d14c2cf3012dc026c`.

Entregue:
- endpoint Admin Login ligado ao runtime persistente;
- criação server-side de runtime;
- 503 neutro quando runtime indisponível;
- preservação do cookie seguro;
- 147/147 testes, lint e build verdes.

Próximo passo: materializar de forma controlada a persistência Admin necessária (`admin_users` e `admin_sessions`) e preparar o primeiro provisionamento real sem versionar secrets.

## Checkpoint concluído — V19.7S Admin Persistence Schema Contract

Status: **concluído** no commit `e969d23880aaf805c609255511b60b916aab5e67`.

Entregue:
- contrato SQL versionado para `admin_users` e `admin_sessions`;
- invariantes, unicidade e índices;
- RLS habilitado e acesso de cliente fechado;
- 154/154 testes, lint e build verdes.

Próximo passo: revisar/materializar esse contrato no ambiente Supabase real de forma controlada, ainda sem criar usuário ou senha real no Git.

## Checkpoint concluído — V19.7T Admin Persistence Materialization Guard

Status: **concluído** no commit `5800452fbedf5a7bdf07d48e31500ba5feba2a12`.

Entregue:
- preflight/postflight read-only;
- regra de parada para tabelas preexistentes;
- verificação de RLS, policies, grants e índices;
- 161/161 testes, lint e build verdes.

Próximo passo: executar somente o preflight read-only no Supabase real. Se ambas as tabelas não existirem, então aplicar o contrato SQL V19.7S e executar o postflight. Nenhum usuário Admin deve ser provisionado antes dessa comprovação.

## V19.7U — Materialização real do schema Admin

Concluída operacionalmente e aprovada por postflight completo. Próxima unidade: projetar e testar o provisionamento seguro da primeira identidade administrativa antes de inserir qualquer credencial real.

## V19.7V — Bootstrap seguro do primeiro Admin — concluído

Checkpoint técnico `e935a474f09f2466c7fda18678d2684084b4e1e3`.

Próximo passo, somente após reconciliação documental: executar controladamente o gerador local com a credencial digitada apenas no terminal, materializar o primeiro Admin no Supabase Roda Festa, verificar o resultado e apagar imediatamente o SQL temporário.

## V19.7W — Primeiro Admin provisionado — concluído operacionalmente

Base: `2edd24c560becdcad58b730b010d4de0b43ebb16`.

O primeiro Admin `OWNER` ativo existe no banco real. O próximo passo é provar o login funcional real usando o endpoint persistente já construído, sem expor a senha em histórico de terminal, Git ou chat.

## V19.7X — Prova funcional do login real — concluída

Próximo passo: preparar o ambiente de deploy do Roda Festa com `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e a allowlist administrativa, então provar o endpoint/browser real.

## V19.7Y — Browser login wiring — concluído tecnicamente

Checkpoint técnico: `40b1a8f6173d1597bbbc68ec2042454d674ffcab`.

Próximo passo:
1. reconciliar documentação;
2. push da branch `planner/v19-mobile-first`;
3. aguardar novo Preview;
4. testar `/admin` no domínio estável da branch;
5. comprovar login real via navegador;
6. depois evoluir a superfície administrativa e, em tema correlato, implementar arquivamento reversível de orçamentos.

## V19.7Z — Admin Session Restore — concluído tecnicamente

Checkpoint técnico: `145345bcd55a7720adaa79167b67dca0299a67dc`.

Próximo passo:
1. reconciliar documentação;
2. push da branch `planner/v19-mobile-first`;
3. aguardar novo Preview;
4. abrir `/admin` no domínio estável da branch;
5. comprovar que uma sessão existente é restaurada após reload;
6. somente depois iniciar a área administrativa autenticada com listagem de orçamentos e arquivamento reversível.

## V19.7ZA — Admin Cookie Path Restore — concluído tecnicamente

Checkpoint técnico: `ccf21c72b88af85cab27828a917d5cddeea7daf5`.

Próximo passo:
1. reconciliar documentação;
2. push da branch `planner/v19-mobile-first`;
3. aguardar Preview;
4. fazer novo login para receber cookie com `Path=/`;
5. executar `Ctrl+R`;
6. confirmar restauração da sessão;
7. iniciar a primeira superfície administrativa de orçamentos.

## Pós-V19.7ZA — Próxima unidade

Restauração de sessão no navegador: concluída.

Próxima prioridade:
1. criar a primeira superfície autenticada de Orçamentos no Admin;
2. listar planejamentos/orçamentos reais persistidos;
3. permitir abrir o detalhe sem recalcular snapshots históricos;
4. preparar filtros/status;
5. incluir arquivamento reversível;
6. manter exclusão destrutiva fora do fluxo normal.

## 2026-08-26 — Checkpoint pós-V19.8C

### Agora

1. Resolver acesso mobile ao Preview sem confundir Vercel Authentication com login Roda Festa.
2. Executar smoke real completo com um novo orçamento após materialização de `planning_sessions`.
3. Confirmar que o orçamento aparece no Admin e que o detalhe preserva entrada, recomendação, timeline e final.
4. Validar visualmente Admin e Planning em celular real.
5. Executar postflight independente de infraestrutura para `planning_sessions`: RLS, policies, grants e índices.

### Depois do primeiro orçamento real

- realizar casos comparativos de sugestão do motor;
- registrar alterações feitas pela especialista;
- validar proposta final;
- acumular histórico explicável;
- preparar protocolo de calibração offline;
- nunca promover ajuste do motor apenas porque um único orçamento foi alterado.

### Dívidas conhecidas não bloqueadoras

- warning de build: `src/styles/colors.css` vazio;
- CanonicalPDF persistido continua pendente;
- arquivamento/desarquivamento de orçamentos permanece unidade futura;
- tabela comercial Admin e agenda permanecem futuras superfícies.

## 2026-08-27 — Atualização de prioridade após prova mobile

A prioridade anterior de “resolver acesso mobile ao Preview” foi concluída operacionalmente por meio de Shareable Link da Vercel, comprovado em celular fora do Wi-Fi da empresa e com acesso também à rota `/admin`.

A sequência segura passa a ser:

1. reconciliar documentalmente a prova do Shareable Link — concluído por esta atualização;
2. decidir e preparar publicação estável para uso cotidiano, sem depender de URL temporária de Preview;
3. criar fluxo versionado e testado para provisionamento de usuário adicional, preservando OWNER e permitindo identidade ADMIN individual para Adrielly;
4. executar postflight independente de `planning_sessions`: RLS, policies, grants e índices;
5. executar o primeiro orçamento real ponta a ponta após a materialização da tabela;
6. usar esse primeiro caso como evidência para a cadeia `InputSnapshot → RecommendationSnapshot → PlanningChange[] → FinalProposalSnapshot → Admin read model`;
7. somente depois avançar em calendário/overview operacional e gestão versionada de preços, preservando histórico dos orçamentos.

A publicação estável não deve relaxar a autenticação própria do Admin nem misturar, sem governança, ambiente de teste e dados de uso cotidiano.

## 2026-08-27 — planning_sessions: postflight estrutural concluído

O postflight independente de `public.planning_sessions` foi concluído com GREEN estrutural no Supabase.

Comprovado:
- RLS ativo;
- nenhuma policy;
- `anon` e `authenticated` sem SELECT/INSERT/UPDATE/DELETE;
- grants administrativos/server-side preservados;
- 7 índices;
- 2 triggers;
- 5 constraints;
- contagem inicial observada: 0.

Próxima prioridade:
1. executar o primeiro orçamento real persistido ponta a ponta;
2. comprovar `InputSnapshot → RecommendationSnapshot → PlanningChange[] → FinalProposalSnapshot → Admin read model`;
3. verificar que a contagem deixa de ser 0 e que o registro aparece corretamente no Admin;
4. documentar a comparação entre sugestão original, alterações humanas e proposta final;
5. depois avançar para provisionamento de usuário ADMIN individual/publicação estável conforme a ordem técnica decidida na sessão.


## 2026-08-27 — Consolidação canônica para Production

Objetivo: eliminar a ambiguidade operacional entre branch/Preview/configuração e estabelecer uma única referência cotidiana do Roda Festa, sem apagar o histórico de deployments usado para rollback.

Estado atual:
- [x] Supabase canônico identificado: Project Ref `ezccivmuvlqvzhojnoxn`;
- [x] existência de `planning_sessions`, `admin_users` e `admin_sessions` confirmada nesse projeto;
- [x] `SUPABASE_URL` cadastrada no escopo Production da Vercel;
- [x] Secret Key moderna cadastrada no escopo Production sob o nome histórico `SUPABASE_SERVICE_ROLE_KEY`, sem versionar o valor;
- [x] backend adaptado para Secret Key moderna com compatibilidade legacy;
- [x] checkpoint técnico `ff0f223943990ed24fe9dac0015dd953ca33d123` validado com 210/210 testes, lint e build verdes;
- [ ] concluir esta reconciliação documental e gerar commit documental separado;
- [ ] cadastrar em Production `RODA_FESTA_PLANNING_PERSISTENCE_PROVIDER=supabase`;
- [ ] cadastrar em Production `VITE_PLANNING_SESSION_PERSISTENCE_ENABLED=true`;
- [ ] confirmar Vercel Production Branch = `main`;
- [ ] confirmar domínio/alias estável de Production e então explicitar allowlists de origem aplicáveis;
- [ ] refazer `git fetch` imediatamente antes da consolidação e confirmar que o fast-forward continua válido;
- [ ] fast-forward de `main` para a linha aprovada da `planner/v19-mobile-first`;
- [ ] push de `main` e comprovação visual de deployment **Production** Ready no commit esperado;
- [ ] smoke Production: raiz, Planning, login Admin, restauração de sessão e `/api/admin-quotes`;
- [ ] comprovar leitura no Admin da sessão real FINALIZED já existente;
- [ ] se o Admin continuar vazio, retomar o diagnóstico do read path somente na Production canônica;
- [ ] registrar deployment, domínio, Project Ref e evidências sem secrets;
- [ ] gerar snapshot somente depois do checkpoint técnico + reconciliação documental + working tree limpa;
- [ ] somente depois avaliar retirada da branch remota `planner/v19-mobile-first`.

Após a consolidação, Preview deve voltar a ser laboratório. Como hardening posterior, evitar que Previews arbitrários mutem o banco real de Production; planejar isolamento de dados/configuração de teste sem introduzir complexidade durante esta migração.
