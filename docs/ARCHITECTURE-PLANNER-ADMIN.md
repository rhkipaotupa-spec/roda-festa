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

## V19.7T — Admin Persistence Materialization Guard — checkpoint `5800452fbedf5a7bdf07d48e31500ba5feba2a12`

A V19.7T cria uma barreira explícita entre o contrato SQL Admin versionado e qualquer execução no Supabase real.

### Propriedades consolidadas
- preflight read-only para verificar existência de `admin_users` e `admin_sessions`;
- postflight read-only para verificar existência, RLS, policies, grants e índices;
- se qualquer tabela já existir, a materialização deve parar antes de aplicar o contrato;
- o guard não contém comandos destrutivos ou de mutação executáveis;
- comentários SQL são ignorados pelo teste de mutação;
- nenhuma Supabase CLI foi instalada;
- nenhuma execução SQL remota ocorreu;
- nenhuma migration remota foi aplicada;
- nenhuma tabela remota foi criada;
- nenhum usuário/senha real ou secret foi introduzido.

### Baseline
Checkpoint técnico `5800452fbedf5a7bdf07d48e31500ba5feba2a12` com 161/161 testes, lint verde e build de produção verde.

## V19.7U — Materialização real do schema Admin no Supabase

Preflight comprovou `admin_users = NULL` e `admin_sessions = NULL`. O contrato V19.7S foi então executado manualmente no Supabase Roda Festa.

Postflight comprovado: 2/2 tabelas presentes; RLS `true` nas duas; zero policies; zero grants diretos para `anon`/`authenticated`; 4/4 índices obrigatórios presentes.

Nenhuma identidade administrativa ou credencial real foi provisionada nesta etapa.

## V19.7V — Secure First Admin Bootstrap Provisioning — `e935a474f09f2466c7fda18678d2684084b4e1e3`

Foi introduzido um mecanismo local, one-time e fail-high para preparar o provisionamento da primeira identidade administrativa sem escrita remota automática.

Propriedades validadas: entrada de senha interativa sem eco; confirmação e política mínima; hashing com salt aleatório; SQL sensível somente em diretório temporário; nenhuma senha bruta no SQL; recusa se já existir Admin; ausência de service-role, connection string e chamadas remotas no gerador.

Baseline: 168/168 testes, lint e build verdes.

## V19.7W — Primeiro Admin real provisionado

Base local antes da operação remota: `2edd24c560becdcad58b730b010d4de0b43ebb16`.

O primeiro Admin do Roda Festa foi provisionado no Supabase por bootstrap one-time gerado localmente, sem escrita remota automática pelo gerador.

### Evidência operacional
- contagem pré-bootstrap: `0`;
- bootstrap executado no SQL Editor: sucesso;
- arquivo SQL temporário sensível apagado e existência conferida como `APAGADO`;
- contagem pós-bootstrap: `1`;
- papel: `OWNER`;
- estado: ativo (`true`);
- nenhum hash, salt, senha ou secret foi registrado na documentação ou Git.

A prova funcional de login real ainda permanece pendente e deve ser tratada como etapa separada.

## V19.7X — Prova funcional real do login Admin

Base local: `85af4708f436f0533ed83edcf869ee915018cd25`.

Smoke temporário fora do repositório executado contra o Supabase real usando `createAdminRuntime()`.

Resultado: login real OK; role OWNER; cookie de sessão OK; persistência de sessão OK; nenhum token, cookie, senha ou service-role exibido.

## V19.7Y — Browser Admin Login Wiring — `40b1a8f6173d1597bbbc68ec2042454d674ffcab`

O formulário `/admin` passou a chamar o endpoint real `/api/admin-login` em same-origin, preservando o backend persistente já validado contra o Supabase.

Propriedades consolidadas:
- POST same-origin;
- payload limitado a `identifier` e `credential`;
- cookie administrativo aceito pelo navegador;
- estado de loading e bloqueio de duplo submit;
- erro público neutro;
- limpeza da senha do estado React após sucesso;
- nenhuma chave Supabase no frontend;
- sem navegação falsa para dashboard ainda inexistente.

A identidade visual atual do Admin permanece não aprovada e será tratada em unidade visual separada.

## V19.7Z — Admin Session Restore — `145345bcd55a7720adaa79167b67dca0299a67dc`

A superfície `/admin` passou a restaurar uma sessão administrativa já válida após reload ou nova abertura.

Arquitetura consolidada:
- endpoint read-only `GET /api/admin-session`;
- cookie administrativo continua HttpOnly e não é lido pelo JavaScript;
- validação reutiliza `authenticationComposition.authenticate()`;
- sem sessão válida: resposta pública `authenticated: false`;
- sessão válida: resposta pública mínima com `authenticated`, `role` e `expiresAt`;
- nenhum `sessionId`, `userId`, capability, token ou token hash é exposto;
- frontend consulta a sessão ao montar e só restaura o estado autenticado após confirmação server-side;
- sem `localStorage`, `sessionStorage` ou persistência de token no frontend.

## V19.7ZA — Admin Cookie Path Restore — `ccf21c72b88af85cab27828a917d5cddeea7daf5`

O smoke real da V19.7Z identificou incompatibilidade entre o `Path=/admin` do cookie `rf_admin_session` e o endpoint read-only `GET /api/admin-session`.

Correção consolidada:
- cookie administrativo passa a usar `Path=/`;
- mantém `HttpOnly`, `SameSite=Lax` e `Secure` em produção;
- token continua opaco e resolvido somente server-side;
- JavaScript continua sem acesso ao cookie;
- logout/limpeza usa o mesmo path do cookie de sessão;
- teste de regressão cobre `/admin` e `/api/admin-session`.

## V19.7ZA — Prova real de restauração no navegador

Smoke real concluído com sucesso no Preview da branch `planner/v19-mobile-first`.

Sequência comprovada:
- login administrativo real;
- cookie `rf_admin_session` emitido sob o contrato atualizado;
- `Ctrl+R`;
- chamada de restauração da sessão;
- interface permaneceu autenticada;
- mensagem exibida: `Sessão administrativa restaurada com segurança.`

A restauração da sessão administrativa no navegador deixa de ser pendência arquitetural desta etapa.

## 2026-08-26 — Estado implementado após V19.8C

### Central Admin read-only de Orçamentos

A primeira superfície operacional do Admin foi materializada:
- `/admin` restaura sessão por endpoint same-origin;
- `GET /api/admin-quotes` lista jornadas persistidas somente após autenticação Admin;
- leitura usa `planning_sessions` server-side;
- summaries/details preservam snapshots históricos sem recálculo;
- ausência de registros é um estado válido e explícito.

### PlanningSession real no Supabase

A tabela `public.planning_sessions`, prevista desde a fundação V19.7, foi materializada no projeto Supabase Roda Festa em 2026-08-26 após smoke do Admin revelar sua ausência.

Verificações realizadas:
- existência confirmada;
- RLS confirmado ativo;
- contagem inicial confirmada em zero.

A API deixou de falhar com `admin_quotes_unavailable` e passou a responder lista vazia válida.

A arquitetura continua exigindo serviço server-side com credencial privilegiada; navegador não deve acessar a tabela diretamente.

### Navegação administrativa

O Admin pode abrir o Planning com contexto explícito:
`/planning-book?admin=1&return=/admin`.

Nesse contexto:
- Planning exibe “Modo administrativo”;
- “Voltar ao Admin” permanece disponível durante a jornada;
- retorno aceita apenas caminho interno;
- sessão Admin continua protegida por cookie HttpOnly e não é lida pelo JavaScript.

### Estado de restauração Admin

A UI possui três estados distintos:
1. verificação de sessão;
2. login quando não autenticado;
3. workspace quando autenticado.

O formulário não é renderizado durante a verificação server-side, evitando flash visual e reduzindo ambiguidade de estado.

### Identidade visual aprovada

Admin e Planning passam a compartilhar:
- marrom escuro;
- creme/papel;
- dourado;
- tipografia editorial + controles funcionais.

O vinho histórico deixa de ser a cor dominante do ambiente administrativo.

### Próxima prova arquitetural obrigatória

Criar uma jornada real após a materialização de `planning_sessions` e verificar ponta a ponta:

`InputSnapshot -> RecommendationSnapshot -> PlanningChange[] -> FinalProposalSnapshot -> Admin read model`.

Somente após essa prova o histórico deve ser usado como base para experimentos de calibração do recomendador.

## 2026-08-28 — Reconciliação do fechamento operacional de 27/08/2026

Esta seção registra arquiteturalmente os dois hotfixes que chegaram a `main` e a Production após a última reconciliação documental de 27/08.

### Timeline de PlanningChange permanece append-only durante a finalização

Um smoke controlado comprovou que o estado final dos serviços estava correto, mas ações intermediárias já persistidas desapareciam depois de `finalize()`.

Causa raiz comprovada: a finalização sobrescrevia `planning_changes` com deltas líquidos de produto calculados no fechamento. Isso violava a semântica append-only da timeline e apagava fatos históricos previamente registrados.

Correção consolidada em `main`:
- commit `f186f7f` — `fix: preserve planning timeline on finalization`;
- `appendChanges()` permanece o caminho de escrita dos eventos históricos;
- `finalize()` não escreve mais em `planning_changes`;
- comparação Motor x Final continua derivada separadamente dos snapshots autoritativos;
- eventos históricos perdidos em smokes antigos não devem ser reconstruídos ou fabricados retroativamente.

Invariante reforçada:

`RecommendationSnapshot -> PlanningChange[] append-only -> FinalProposalSnapshot`

A finalização congela a proposta final, mas não reescreve a história que levou até ela.

### Código canônico da proposta passa a ser alocado server-side

Foi comprovada uma colisão de códigos em nova sessão/navegador porque o formato `RF-YYMMDD-xxxxx` era gerado no frontend com sequência mantida em `localStorage`, enquanto o banco aplicava unicidade global sobre o código persistido. Um navegador novo podia reiniciar a sequência em `00001` e receber conflito 409 para um código já existente.

A autoridade do código canônico foi movida para o servidor/banco.

Contrato consolidado:
- migration `infra/migrations/20260827_v19_8_server_proposal_codes.sql`;
- tabela `public.planning_proposal_sequences` com sequência diária;
- RPC `public.allocate_planning_proposal_code()`;
- timezone operacional `America/Sao_Paulo`;
- bootstrap pelo maior código canônico já persistido no dia;
- alocação atômica por `INSERT ... ON CONFLICT ... UPDATE`;
- `anon` e `authenticated` sem permissão de execução;
- execução reservada ao backend privilegiado;
- índice único do snapshot final permanece como proteção de integridade;
- com persistência ativa, o navegador não é autoridade do código e recebe o código confirmado pelo servidor após a finalização;
- `localStorage` pode permanecer apenas como fallback de modo não persistido, nunca como autoridade de Production.

Checkpoint em `main`:
`7381154623d26efa6309f31f9e386281de46536f` — `fix: allocate proposal codes server-side`.

A migration foi materializada manualmente no Supabase Production canônico antes do deploy do código consumidor, com resultado observado `Success. No rows returned`.

### Identidade administrativa e prova operacional final

Em 27/08 foi criada uma identidade administrativa permanente adicional para Adrielly com role `ADMIN`, sem reutilizar o bootstrap do primeiro `OWNER`. O provisionador foi temporário; a conta é permanente. Nenhuma senha em texto puro, token, cookie ou secret foi registrado em Git, documentação ou chat.

Após migration e promoção controlada dos hotfixes para `main`, o smoke real em `https://roda-festa.vercel.app` comprovou:
- login da Adrielly;
- acesso ao Admin;
- criação de novo planejamento em sessão independente;
- conclusão do planejamento sem o conflito 409 anterior.

### Limite de evidência do baseline

A validação `247/247 + lint + build` ocorreu na branch `feat/admin-operations-foundation`, que continha também a fundação local de Admin Operations não promovida para Production. Esse total não é baseline exata de `main`.

Depois dos cherry-picks finais, a prova conclusiva de `main` foi o smoke real de Production. Uma futura baseline completa de `main` deve ser registrada somente quando reexecutada nessa branch.

<!-- V19.9A_DOC_RECONCILIATION_b5cd5ad -->
## V19.9A — Camada de apresentação da proposta

A V19.9A introduz uma separação explícita entre verdade comercial e leitura apresentada ao cliente.

Checkpoint técnico desta arquitetura:
`b5cd5ad6bc8fb495474f0f3122ece8b5510e1618` — `feat: improve client proposal clarity`.

Fluxo preservado:
`InputSnapshot -> RecommendationSnapshot -> PlanningChange[] -> FinalProposalSnapshot -> Admin read model`.

A nova função `buildProposalPresentation()`, em `src/planner/planning-book/proposalPresentation.js`, recebe apenas valores já calculados/persistidos para produzir leituras derivadas de UI/PDF:
- investimento contratado;
- consignação estimada;
- estimativa geral do evento;
- contratado por pessoa;
- estimativa geral por pessoa.

Essa camada não recalcula preço de produto, carrinhos, horas, garçons, descartáveis nem Commercial Ledger e não deve evoluir para uma segunda autoridade comercial.

O tipo de evento `cha-bebe` passa a fazer parte do contrato de entrada aceito pela UI e por `api/planning-sessions.js`. Tipos desconhecidos continuam fail-closed.

Para PDF/print, a arquitetura distingue:
- capa: página A4 isolada;
- conteúdo: fluxo paginado naturalmente pelo navegador, sem quebra forçada no container genérico.

Brigadeiro no tacho e carrinho avulso permanecem fora desta camada porque alteram catálogo/estrutura operacional e exigem modelagem própria no motor/ledger.
