# Roda Festa - Arquitetura Planner, Admin e Inteligência Operacional

## 1. Objetivo

Construir uma plataforma comercial e operacional que seja simples para a cliente, rigorosa para a Roda Festa e capaz de aprender com eventos reais sem perder rastreabilidade.

A arquitetura deve responder, a qualquer momento:

1. o que a cliente informou;
2. o que o motor recomendou;
3. qual versão do motor e tabela de preços produziu essa recomendação;
4. o que foi alterado depois;
5. qual proposta foi aprovada;
6. como cada centavo do total foi formado;
7. qual PDF foi entregue à cliente e armazenado internamente;
8. qual foi o resultado real do evento;
9. qual evidência justifica futuras mudanças do algoritmo.

## 2. Princípios de arquitetura

### 2.1 Uma única verdade comercial

Nenhuma tela deve reconstruir preço por conta própria. O motor comercial produz um ledger financeiro canônico. Planner, Admin, e-mail, PDF e integrações apenas apresentam esse resultado.

Invariante principal:

`SUM(ledger.contractedLines.subtotal) === finalProposal.investmentTotal`

Invariantes complementares:

- `cartsValue === chargedTotalCarts * cartBasePrice`;
- consignação não integra o investimento contratado;
- carrinho necessário para consignação continua integrando a estrutura cobrada;
- horas adicionais usam exatamente a quantidade de carrinhos cobrados;
- preços oficiais são obtidos de catálogo confiável no servidor;
- proposta histórica nunca é recalculada com tabela futura.

### 2.2 Cliente sem login obrigatório

O Planner não deve exigir criação de senha para gerar uma proposta.

A identidade inicial será uma `PlanningSession` anônima criada pelo servidor e associada a um identificador seguro. Quando a cliente informar telefone/e-mail, a sessão pode ser vinculada ao contato.

Para retomada futura em outro dispositivo, a arquitetura deve permitir link mágico/código temporário, sem obrigar uma conta tradicional.

### 2.3 Admin sempre autenticado

A Central Roda Festa conterá dados pessoais, agenda, preços, histórico comercial e auditoria. Portanto, acesso administrativo exige autenticação e autorização server-side.

Perfis inicialmente previstos:

- `OWNER`: proprietárias; acesso total;
- `COMMERCIAL`: propostas, clientes e agenda;
- `OPERATION`: eventos confirmados e pós-evento, sem alteração irrestrita de preço.

A primeira implantação pode começar apenas com `OWNER`, sem comprometer a evolução futura.

### 2.4 Histórico imutável, não sobrescrita

A recomendação original nunca é substituída pela edição final. Cada etapa importante gera snapshot ou evento de negócio.

Fluxo conceitual:

`PlanningSession -> InputSnapshot -> RecommendationSnapshot -> PlanningChange[] -> FinalProposalSnapshot -> CanonicalPDF -> EventOutcome`

### 2.5 Aprendizado controlado

Dados históricos não alteram automaticamente o motor de produção.

Uma nova versão do recomendador deve:

1. ser criada como candidata;
2. ser executada contra eventos históricos;
3. comparar recomendação candidata, recomendação antiga, decisão final e resultado real;
4. ser revisada pela Roda Festa;
5. só então ser promovida.

## 3. Modelos de domínio planejados

### PlanningSession

Representa a jornada da cliente, mesmo sem login.

Campos essenciais:

- `id`;
- `createdAt` / `updatedAt`;
- `status`;
- `contactId` opcional;
- `anonymousSessionTokenHash`;
- `source`;
- `lastActivityAt`.

### InputSnapshot

- tipo de evento;
- data;
- convidados por faixa;
- duração;
- cardápio selecionado inicialmente;
- serviços opcionais.

### RecommendationSnapshot

- versão do algoritmo;
- versão das regras comerciais;
- versão da tabela de preços;
- entradas utilizadas;
- itens e quantidades sugeridos;
- estrutura sugerida;
- ledger sugerido;
- total sugerido;
- timestamp.

### PlanningChange

Registrar apenas alterações comercialmente relevantes, não cliques de interface.

Tipos previstos:

- `ITEM_QUANTITY_CHANGED`;
- `ITEM_ADDED`;
- `ITEM_REMOVED`;
- `ITEM_REPLACED`;
- `CATEGORY_ADDED`;
- `CATEGORY_REMOVED`;
- `GUEST_COUNT_CHANGED`;
- `DURATION_CHANGED`;
- `SERVICE_ADDED`;
- `SERVICE_REMOVED`;
- `ADMIN_ADJUSTMENT`.

Cada evento terá `actor`, `before`, `after`, `timestamp` e, quando aplicável, `reason`.

Atores:

- `CLIENT`;
- `ENGINE`;
- `ADMIN`;
- `SYSTEM`.

### CommercialLedger

Fonte discriminada do orçamento.

Cada linha terá:

- tipo;
- item/serviço;
- quantidade;
- preço unitário vigente;
- subtotal;
- versão de preço;
- indicação de consignação;
- metadados operacionais quando necessários.

Linhas típicas:

- produtos;
- carrinhos;
- horas adicionais;
- garçons;
- descartáveis;
- outros serviços futuros.

### FinalProposalSnapshot

Congela tudo que foi aprovado, inclusive ledger e versões. Nunca deve depender de recálculo futuro.

### CanonicalPDF

Artefato único produzido do `FinalProposalSnapshot`.

Deve armazenar:

- identificador;
- hash criptográfico;
- caminho/objeto persistido;
- versão do template;
- timestamp;
- vínculo com a proposta.

O mesmo arquivo é oferecido à cliente e retido pela Roda Festa.

### EventOutcome

Registro pós-evento para aprendizado.

Por item/categoria, quando houver evidência:

- quantidade contratada;
- quantidade efetivamente levada;
- sobra estimada;
- falta percebida;
- classificação `INSUFICIENTE`, `IDEAL`, `PEQUENA_SOBRA`, `SOBRA_ALTA`;
- observação da especialista.

## 4. Central Admin

### 4.1 Dashboard

- próximos eventos;
- propostas aguardando revisão;
- propostas com inconsistência;
- eventos sem pós-evento preenchido;
- alertas de integridade;
- versão atual do motor/tabela.

### 4.2 Agenda

- calendário/lista;
- cliente;
- data e horário;
- convidados;
- status;
- carrinhos/estrutura;
- valor;
- pendências;
- acesso rápido à ficha.

### 4.3 Ficha da cliente/evento

Quatro blocos de negócio:

1. entrada da cliente;
2. sugestão original;
3. alterações;
4. proposta final.

Após realização, quinto bloco: resultado real.

### 4.4 Reconciliação financeira

Visão interna obrigatória e discriminada:

| Componente | Quantidade | Unitário | Subtotal |
| --- | ---: | ---: | ---: |
| Produto A | ... | ... | ... |
| Produto B | ... | ... | ... |
| Carrinhos | ... | ... | ... |
| Horas adicionais | ... | ... | ... |
| Garçons | ... | ... | ... |
| Descartáveis | ... | ... | ... |
| **Total reconciliado** | | | **...** |
| **Total aprovado** | | | **...** |
| **Diferença** | | | **R$ 0,00** |

Uma proposta nova com diferença diferente de zero deve ser bloqueada e marcada como inconsistente.

### 4.5 Tabela comercial

Alteração fácil para proprietárias, mas versionada:

- produto/serviço;
- preço atual;
- unidade;
- vigência;
- histórico;
- autor da alteração;
- justificativa opcional.

Alterar preço nunca modifica proposta histórica.

### 4.6 Saúde do recomendador

No futuro:

- percentual aceito sem alteração;
- categorias mais aumentadas/reduzidas;
- itens mais adicionados/removidos;
- divergência média sugestão x final;
- pós-evento por categoria;
- comparação entre versões do motor.

## 5. Segurança

Antes do Admin público em produção:

- autenticação robusta;
- autorização server-side;
- sessão segura HttpOnly/Secure/SameSite;
- proteção CSRF nas mutações;
- rate limiting;
- validação server-side de todos os inputs;
- segredos somente no ambiente de deploy;
- auditoria de alterações de preço/proposta;
- persistência durável e backup;
- dados pessoais mínimos e retenção definida.

## 6. Estado técnico de 25/08/2026

A primeira fundação implementada nesta unidade adiciona:

- `CommercialLedger` canônico no motor atual;
- reconciliação automática de soma;
- versões explícitas de recomendação, regras comerciais e tabela de preços;
- preservação transitória da recomendação original no snapshot final;
- comparação recomendação x final;
- recalculo autoritativo no servidor antes do envio interno;
- rejeição de preço/total/carrinhos adulterados no payload;
- suíte automatizada de regressão comercial com Node Test Runner.

Ainda não implementado nesta unidade:

- banco de dados;
- PlanningSession server-side;
- autenticação Admin;
- UI Admin;
- PDF canônico binário;
- event log persistido;
- coleta pós-evento.

Esses itens permanecem nas próximas fases do ROADMAP e não devem ser simulados com `localStorage` como solução definitiva.

## 7. Evolucao V19.7A - Porta de persistencia e isolamento de infraestrutura

A implementacao de `PlanningSession` passa a obedecer a uma porta de persistencia independente do fornecedor.

Camadas:

`Planner/API -> PlanningSessionRepository -> Adapter -> Persistencia`

Adapters inicialmente existentes:

- `memory`: somente testes e execucao controlada; nunca fallback silencioso de producao;
- `supabase`: implementacao server-side preparada para futura ativacao, exigindo configuracao explicita.

Invariantes da fundacao:

1. token anonimo e gerado com alta entropia;
2. persistencia recebe somente hash do token;
3. posse exige combinacao de identificador da sessao e hash;
4. cookie de sessao e HttpOnly, SameSite e Secure em producao;
5. mutacoes exigem origem confiavel;
6. criacao e idempotente;
7. mutacoes usam versao esperada para detectar concorrencia;
8. recomendacao original nao pode ser sobrescrita;
9. segunda finalizacao divergente e bloqueada;
10. credencial privilegiada de provedor so pode trafegar server-side;
11. ausencia de configuracao de persistencia real falha alto;
12. migration nunca e executada automaticamente por pacote de atualizacao.

### 7.1 Estado apos o checkpoint V19.7A

Checkpoint tecnico: `452be928190ad66b924a710f12d98d2b1a6f3964`.

Validacao oficial: 20/20 testes, lint verde e build verde no Windows.

A fundacao existe, mas ainda nao representa persistencia duravel de producao. O fluxo atual da cliente permanece inalterado. A migration Supabase/PostgreSQL esta versionada e inativa.

A ativacao futura do banco do Roda Festa sera uma unidade separada e nao podera exigir qualquer alteracao nos ambientes do Simplify.

## 8. Evolução V19.7C - Timeline explicável de PlanningChange

A jornada passa a possuir uma sequência de mudanças de negócio entre a recomendação e a proposta final.

Modelo conceitual:

`PlanningSession -> RecommendationSnapshot -> PlanningChange[] -> FinalProposalSnapshot`

Propriedades obrigatórias da timeline:

1. append-only;
2. ordem determinística;
3. ator normalizado no servidor;
4. timestamp gerado/normalizado no servidor;
5. ownership herdado da sessão segura;
6. controle otimista por versão;
7. validação de tipo e referências de produto;
8. bloqueio de mutações após finalização;
9. nenhuma linha da timeline é autoridade de preço;
10. leitura futura do Admin deve usar os fatos históricos congelados, não recalcular o passado.

Checkpoint técnico V19.7C: `a9e6bf89e1e8799a0d9625a9e2731a624f4c447b`.

Validação oficial: 38/38 testes, lint verde e build verde no Windows.

A persistência remota continua desativada. A timeline está preparada arquiteturalmente, mas sua durabilidade real só será considerada concluída quando a infraestrutura própria do Roda Festa for ativada e validada.

## V19.7D — Journey Read Model — checkpoint `ce536b4ec42824eb904fdb4fcfb1353c4a2105eb`

A V19.7D introduz uma camada explícita de leitura da jornada do planejamento, separando reconstrução histórica de cálculo comercial. O read model deve reconstruir os fatos já persistidos — entrada, recomendação autoritativa, timeline append-only e proposta final — sem recalcular ou reinterpretar retroativamente o histórico.

### Invariantes consolidadas
- A leitura é protegida por ownership da sessão.
- O servidor é a fronteira autoritativa da leitura.
- O read model não muta os snapshots de origem.
- Uma proposta final sem recomendação histórica correspondente é inválida.
- A timeline preserva ordenação e fatos históricos.
- O read model aceita tanto a forma normalizada `camelCase` quanto a forma persistida `snake_case` retornada pelos adapters.
- Persistência remota permanece desligada por padrão.
- Nenhuma migration foi executada nesta unidade.

### Integração
O fluxo de leitura foi conectado de ponta a ponta: client same-origin → API → repository → adapter → Journey Read Model. O token anônimo permanece fora do payload do navegador e a posse continua derivada do cookie/token tratado no servidor.

### Baseline de fechamento
Checkpoint técnico: `ce536b4ec42824eb904fdb4fcfb1353c4a2105eb`. Validação final: 44/44 testes, lint verde e build de produção verde.

## V19.7E — Admin Journey Query — checkpoint `2852f946e2f9430afdc247f093ba2c421c035ecb`

A V19.7E adiciona um contrato derivado de leitura para a futura Central Admin, construído sobre o Journey Read Model da V19.7D. O objetivo é disponibilizar uma representação administrativa estável e explicável sem misturar consulta com regra comercial ou reconstrução histórica.

### Contrato entregue
- resumo de sessão/evento e status;
- total recomendado, total final e total efetivo;
- quantidade de itens e quantidade de mudanças;
- reconciliação comercial transportada como fato histórico;
- visão detalhada com snapshots de entrada, recomendação e proposta final;
- isolamento por clone para impedir mutação dos snapshots de origem.

### Limite de segurança
A unidade deliberadamente não cria endpoint administrativo global, listagem de sessões ou bypass de ownership. A futura exposição administrativa deverá ficar atrás de autenticação e autorização explícitas. Persistência remota continua desligada e nenhuma migration foi executada.

### Baseline
Checkpoint técnico `2852f946e2f9430afdc247f093ba2c421c035ecb`: 48/48 testes, lint verde e build de produção verde.

## V19.7F — Admin Authorization Boundary — checkpoint `58bba0cb009d2823efa65d615fe9799990e74924`

A V19.7F introduz uma fronteira explícita de autorização administrativa antes da criação de qualquer endpoint Admin global. A regra de acesso deixa de ser uma preocupação dispersa e passa a existir como componente reutilizável, fail-closed e testável.

### Propriedades consolidadas
- principal administrativo normalizado;
- ausência de principal bloqueia acesso;
- roles administrativas são explícitas;
- conta inativa é bloqueada;
- capability pode ser exigida por operação;
- a boundary pode ser reutilizada por futuras rotas sem duplicar regra;
- não há login real nem sessão administrativa nesta unidade;
- nenhum endpoint Admin global foi criado;
- persistência remota continua desligada;
- nenhuma migration foi executada.

### Baseline
Checkpoint técnico `58bba0cb009d2823efa65d615fe9799990e74924` com 55/55 testes, lint verde e build de produção verde.

## V19.7G — Admin Authentication Contract — checkpoint `2e08ee32042de8cd5614091a49371975b7761c37`

A V19.7G introduz o contrato de autenticação administrativa que precede qualquer integração com um provedor real de identidade. A autenticação produz um principal confiável a partir de uma sessão resolvida exclusivamente no servidor; a Authorization Boundary permanece responsável por decidir o acesso.

### Propriedades consolidadas
- token administrativo obtido somente do cookie configurado;
- ausência de resolver de sessão falha alto;
- ausência de cookie permanece não autenticada;
- role e capabilities vêm somente da sessão confiável resolvida no servidor;
- sessões expiradas e tempos de vida inválidos são rejeitados;
- contrato de cookie nasce HttpOnly, SameSite=Lax e Secure em produção;
- principal autenticado alimenta a Authorization Boundary sem acoplamento ao provedor;
- nenhum login real, usuário/senha ou secret foi criado;
- nenhum endpoint Admin global foi criado;
- persistência remota continua desligada;
- nenhuma migration foi executada.

### Baseline
Checkpoint técnico `2e08ee32042de8cd5614091a49371975b7761c37` com 63/63 testes, lint verde e build de produção verde.

## V19.7H — Admin Session Repository — checkpoint `eb1713d82f937ceaf0dbe94f736336cff3a8e135`

A V19.7H adiciona a fundação provider-agnostic de armazenamento e ciclo de vida de sessões administrativas, preservando a separação entre autenticação, autorização e persistência.

### Propriedades consolidadas
- token administrativo opaco com alta entropia;
- persistência somente do hash do token;
- criação, resolução, revogação e rotação de sessão;
- expiração validada server-side;
- token anterior invalidado após rotação;
- principal resolvido nunca expõe `tokenHash`;
- adapter em memória restrito a testes e proibido em produção por padrão;
- nenhum login real, usuário/senha ou secret foi criado;
- nenhum endpoint Admin global foi criado;
- nenhum banco remoto foi ativado;
- nenhuma migration foi executada.

### Baseline
Checkpoint técnico `eb1713d82f937ceaf0dbe94f736336cff3a8e135` com 72/72 testes, lint verde e build de produção verde.

## V19.7I — Admin Authentication Composition — checkpoint `b9b847c0ebf117451ae25a2aa2e1309ccd505d8c`

A V19.7I compõe, exclusivamente server-side, as três fundações administrativas já existentes: Admin Authentication Contract, Admin Session Repository e Admin Authorization Boundary.

### Propriedades consolidadas
- cookie opaco é a única credencial apresentada pelo navegador;
- token é resolvido pelo Session Repository;
- role e capabilities vêm exclusivamente da sessão confiável;
- o principal normalizado alimenta a Authorization Boundary;
- ausência de cookie, token desconhecido, sessão expirada ou revogada falham fechados;
- capability insuficiente continua bloqueada;
- rotação invalida o token anterior;
- tentativa de forjar role/capabilities no cookie não atravessa a composição;
- resultado autorizado não expõe token bruto nem tokenHash;
- nenhum login visual foi criado;
- nenhum endpoint Admin global foi criado;
- nenhum banco remoto foi ativado;
- nenhuma migration foi executada.

### Baseline
Checkpoint técnico `b9b847c0ebf117451ae25a2aa2e1309ccd505d8c` com 82/82 testes, lint verde e build de produção verde.

## V19.7J — Admin Authentication HTTP Boundary — checkpoint `3334f7444650b2d93001e1f7d9bd75ec0251d0ef`

A V19.7J adiciona a superfície HTTP mínima de autenticação administrativa sobre as fundações já consolidadas de Authentication Contract, Session Repository, Authentication Composition e Authorization Boundary.

### Propriedades consolidadas
- login HTTP server-side com `credentialVerifier` injetado;
- logout com revogação imediata da sessão;
- refresh com rotação do token e invalidação do token anterior;
- mutações restritas a POST;
- proteção de Origin em login/logout/refresh;
- emissão e limpeza do cookie `rf_admin_session`;
- cookie HttpOnly, SameSite=Lax, Path=/admin e Secure em produção;
- role/capabilities fornecidas pelo navegador são ignoradas;
- respostas não expõem token bruto, tokenHash ou credential;
- nenhum login visual foi criado;
- nenhum usuário/senha real ou secret foi adicionado;
- nenhum endpoint Admin global de jornadas foi criado;
- nenhum banco remoto foi ativado;
- nenhuma migration foi executada.

### Baseline
Checkpoint técnico `3334f7444650b2d93001e1f7d9bd75ec0251d0ef` com 92/92 testes, lint verde e build de produção verde.

## V19.7K — Admin Login Shell — checkpoint `5381ffc5de873781b6e976de53537b98190837ca`

A V19.7K introduz a primeira superfície visual administrativa em `/admin`, preservando a separação entre experiência pública e área Admin.

### Estado arquitetural
- rota `/admin` adicionada ao roteamento existente;
- shell de login isolado em `src/admin/`;
- experiência mobile-first e acessível;
- nenhuma autenticação simulada via frontend;
- nenhuma credencial, usuário ou secret fixo no código;
- nenhuma consulta administrativa global;
- nenhum banco remoto ou migration ativados nesta unidade.

### Validação
Baseline técnico: 96/96 testes, lint verde e build de produção verde.

Também houve validação visual real em iPhone pela rede local. A rota `/admin` carregou corretamente, os campos puderam ser preenchidos e o botão exibiu a mensagem deliberada de que credenciais reais ainda não estavam ativadas.

O placeholder visual `RF` permanece provisório. Branding/logo oficial e refinamento visual ficam registrados como evolução futura, sem bloquear a evolução funcional.

## V19.7L — Admin Credential Verification Contract — checkpoint `4103e39b99b36bce9381a6d1a590a772cb90533d`

A V19.7L adiciona a camada server-side responsável por validar credenciais administrativas antes da ligação do formulário visual `/admin` a um login real.

### Propriedades consolidadas
- hash de credencial com `scrypt`;
- salt criptográfico;
- comparação segura;
- lookup de identidade injetado e server-side;
- normalização somente do identificador;
- credencial preservada como case-sensitive;
- conta inativa rejeitada;
- resultado neutro para usuário inexistente e credencial incorreta;
- role e capabilities derivadas exclusivamente do registro confiável;
- identidade autenticada não expõe hash, salt ou credencial;
- nenhum usuário ou senha real foi criado;
- nenhum secret foi adicionado ao repositório;
- nenhum endpoint HTTP novo foi criado;
- nenhum banco remoto foi ativado;
- nenhuma migration foi executada.

### Baseline
Checkpoint técnico `4103e39b99b36bce9381a6d1a590a772cb90533d` com 106/106 testes, lint verde e build de produção verde.

## V19.7M — Admin Login Composition — checkpoint `0b474af7a12871fa56dcd01a1da71056b0fa773e`

A V19.7M compõe explicitamente o verifier server-side de credenciais da V19.7L com a boundary HTTP administrativa já existente.

### Propriedades consolidadas
- composição server-side dedicada ao login Admin;
- verifier obrigatório e injetado somente pela composição;
- boundary HTTP obrigatória;
- request do cliente não pode substituir o verifier confiável;
- resposta da boundary é preservada sem expor dependências internas;
- nenhum usuário ou senha real foi criado;
- nenhum secret foi adicionado ao repositório;
- nenhum endpoint HTTP novo foi criado;
- nenhum `fetch` foi adicionado ao frontend;
- nenhum banco remoto foi ativado;
- nenhuma migration foi executada.

### Baseline
Checkpoint técnico `0b474af7a12871fa56dcd01a1da71056b0fa773e` com 111/111 testes, lint verde e build de produção verde.

## V19.7M1 — Real Boundary Composition Fix — checkpoint `7f43a827e5ead6e63d10022412e08130ddfb479b`

A V19.7M1 corrige a composição do login Admin para respeitar a interface real da `createAdminAuthHttpBoundary()`.

### Situação anterior
A V19.7M havia sido validada com uma boundary de teste que aceitava o verifier como segundo argumento de `login()`. A boundary real recebe `credentialVerifier` durante sua construção.

### Correção consolidada
- `createAdminLoginComposition()` passa a construir a HTTP Boundary com o verifier confiável;
- o request do navegador não participa da injeção de dependências;
- testes unitários foram alinhados à interface real;
- novo teste de integração usa verifier real + HTTP Boundary real + repository real + authentication composition real;
- a cadeia credencial → verifier → boundary → sessão → cookie foi comprovada;
- credencial incorreta não cria sessão;
- proteção de Origin continua ocorrendo antes da autenticação;
- nenhum usuário/senha real, secret, endpoint novo, `fetch` no frontend, banco remoto ou migration foi introduzido.

### Baseline
Checkpoint técnico `7f43a827e5ead6e63d10022412e08130ddfb479b` com 114/114 testes, lint verde e build de produção verde.

## V19.7N — Admin Login HTTP Endpoint — checkpoint `640100e906652d98c725ac1e9d13ba48842062ed`

A V19.7N cria a primeira porta HTTP concreta do login Admin em `api/admin-login.js`, mantendo o runtime padrão em fail-closed enquanto a composição real ainda não estiver ligada.

### Propriedades consolidadas
- endpoint HTTP dedicado ao login Admin;
- adaptação de método, headers e body para o contrato da HTTP Boundary;
- transporte de `Set-Cookie`;
- resposta controlada para método inválido;
- resposta pública neutra para Origin não confiável;
- resposta pública neutra para credenciais inválidas;
- erro interno inesperado não expõe mensagem, stack, token ou credencial;
- factory do handler exige composição de login válida;
- handler padrão permanece em `503 admin_login_runtime_unavailable`;
- nenhum usuário/senha real, secret, `fetch` no frontend, banco remoto ou migration foi introduzido.

### Baseline
Checkpoint técnico `640100e906652d98c725ac1e9d13ba48842062ed` com 121/121 testes, lint verde e build de produção verde.

## V19.7O — Vercel API Routing Boundary — checkpoint `bbd9ddf422822890d296216e33b12223b606760f`

A V19.7O preserva explicitamente o namespace `/api/*` antes do fallback SPA no `vercel.json`, evitando que funções serverless Admin sejam engolidas pelo rewrite global para `index.html`.

### Propriedades consolidadas
- rewrite explícito `/api/(.*) -> /api/$1`;
- fallback SPA mantido depois da regra de API;
- ordem das regras protegida por testes;
- nenhuma configuração legada `builds` ou `routes`;
- nenhum runtime Admin real ativado;
- nenhum usuário/senha real;
- nenhum secret;
- nenhum `fetch` no frontend;
- nenhum banco remoto;
- nenhuma migration.

### Baseline
Checkpoint técnico `bbd9ddf422822890d296216e33b12223b606760f` com 124/124 testes, lint verde e build de produção verde.

## V19.7P — Admin Supabase Persistence Adapters — checkpoint `8db1e991f62329da29fc580ec79d5a776c9d241b`

A V19.7P cria os adapters server-side de persistência necessários para identidades e sessões administrativas em Supabase, sem ativar ainda o runtime real.

### Propriedades consolidadas
- `createSupabaseAdminIdentityStore()` para lookup de `admin_users`;
- identificador normalizado antes da consulta;
- mapeamento do registro persistido para o contrato do verifier;
- `createSupabaseAdminSessionAdapter()` para `admin_sessions`;
- criação, resolução por token hash, revogação e rotação;
- somente `tokenHash` é persistido; token bruto permanece fora do storage;
- `SUPABASE_SERVICE_ROLE_KEY` é usada exclusivamente server-side;
- configuração ausente falha alto;
- erros remotos não devolvem corpo upstream nem secret;
- nenhum acesso remoto real foi executado durante os testes;
- nenhuma migration, tabela remota, usuário/senha real, hash real, secret, wiring de runtime ou `fetch` no frontend foi introduzido.

### Baseline
Checkpoint técnico `8db1e991f62329da29fc580ec79d5a776c9d241b` com 136/136 testes, lint verde e build de produção verde.

## V19.7Q — Admin Runtime Composition — checkpoint `ea839646658293301b812006dff7adc5a6438329`

A V19.7Q compõe, em uma factory server-side única, os adapters persistentes da V19.7P com verifier, repository, autorização, autenticação e login.

### Cadeia consolidada
`Supabase admin_users`
→ `Identity Store`
→ `Credential Verifier`
→ `Supabase admin_sessions`
→ `Session Repository`
→ `Authorization Boundary`
→ `Authentication Composition`
→ `Login Composition`

### Propriedades consolidadas
- configuração Supabase ausente falha alto;
- `fetch` server-side inválido falha alto;
- não existe fallback para o adapter Admin em memória;
- `SUPABASE_SERVICE_ROLE_KEY` não é exposta no objeto público do runtime;
- runtime público expõe apenas composições necessárias;
- teste integrado comprova login ponta a ponta com adapters Supabase reais sob transporte simulado;
- token bruto permanece fora do registro persistido;
- endpoint `api/admin-login.js` ainda não foi ligado ao runtime;
- nenhuma migration, tabela remota, usuário/senha real, hash real, secret versionado ou `fetch` no frontend foi introduzido.

### Baseline
Checkpoint técnico `ea839646658293301b812006dff7adc5a6438329` com 142/142 testes, lint verde e build de produção verde.

## V19.7R — Admin Login Runtime Wiring — checkpoint `ff5f597dd40ed6f31a95d99d14c2cf3012dc026c`

A V19.7R liga o endpoint `api/admin-login.js` ao runtime Admin persistente consolidado na V19.7Q.

### Propriedades consolidadas
- handler padrão passa a montar `createAdminRuntime()` server-side;
- `process.env` e `globalThis.fetch` são injetados somente no servidor;
- falha de configuração/runtime vira `503 admin_login_runtime_unavailable`;
- stack, mensagens internas e secrets não são expostos;
- runtime inválido falha fechado;
- login válido continua atravessando o HTTP handler existente;
- `Set-Cookie` é preservado;
- nenhum fallback de autenticação em memória foi introduzido;
- nenhuma migration, tabela remota, usuário/senha real, hash real, secret versionado ou ligação do formulário visual foi introduzida.

### Baseline
Checkpoint técnico `ff5f597dd40ed6f31a95d99d14c2cf3012dc026c` com 147/147 testes, lint verde e build de produção verde.

## V19.7S — Admin Persistence Schema Contract — checkpoint `e969d23880aaf805c609255511b60b916aab5e67`

A V19.7S versiona o contrato SQL de persistência Admin derivado dos adapters e testes já aprovados, sem executar nada remotamente.

### Propriedades consolidadas
- `admin_users` com identificador normalizado e único;
- material de verificação separado em algoritmo, salt, hash e key length;
- ausência deliberada de senha bruta;
- `admin_sessions` com `token_hash` único e ausência de token bruto;
- constraints temporais e de versionamento;
- índices compatíveis com os lookups dos adapters;
- RLS habilitado;
- privilégios removidos de `anon` e `authenticated`;
- nenhuma policy aberta para clientes;
- nenhuma execução SQL remota, migration aplicada, tabela remota criada, usuário/senha real, hash/salt real, secret ou alteração de runtime.

### Baseline
Checkpoint técnico `e969d23880aaf805c609255511b60b916aab5e67` com 154/154 testes, lint verde e build de produção verde.
