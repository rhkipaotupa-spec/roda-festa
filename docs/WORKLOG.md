# Roda Festa - WORKLOG

## 2026-08-24

### Contexto recebido

- Base full do projeto recebida para revisão.
- Site institucional considerado aprovado e fora do foco de refatoração.
- Planner definido como foco principal.
- Regra operacional definida: instruções de terminal em CMD.
- Regra de edição definida: quando houver alteração manual de arquivo, entregar caminho completo e conteúdo completo; não usar patches ou pequenos acréscimos.

### Checkpoint pré-V19

- Branch criada: `planner/v19-mobile-first`.
- Commit seguro criado antes da substituição estrutural: `b7e99cd4151f7e902ffddd44506fc253a3f60bd4`.
- Mensagem: `checkpoint: preserve planner pre-v19 state`.
- Commit registrou o estado real acumulado do Planner pré-V19, inclusive changelogs históricos e a correção de carrinhos.
- Working tree confirmada limpa após o checkpoint.

### Migração V19

- V19.1 espelhada sobre o repositório preservando `.git`, `node_modules` e `dist`.
- O primeiro espelhamento com `/MIR` tentou remover documentos históricos e `src/planner.zip` por não existirem no pacote novo.
- Esses arquivos foram restaurados do checkpoint pré-V19 antes de qualquer commit da nova arquitetura.
- Confirmadas mudanças reais em `PlanningBook.jsx`, `PlanningBook.css` e `engine/planningRules.js`.
- `PlanningBook.css` foi reduzido de uma implementação histórica muito extensa para uma camada V19 significativamente mais enxuta, coerente com a nova experiência de uma etapa por tela.

### Mudanças V19

- Arquitetura do Planner migrada para mobile-first, uma etapa por tela.
- Atualização dos preços das porções/tortas de 150 g.
- Preservada a correção de cobrança de carrinhos da V18.1.
- Criado snapshot imutável no fluxo de conclusão.
- Criada tentativa de envio de via interna por `/api/planning-submissions`.
- Adicionada governança documental com FINDINGS, DECISIONS, ROADMAP, WORKLOG e protocolo de snapshot.
- Protocolo de snapshot migrado de PowerShell para Node, mantendo execução pelo CMD através de `npm run snapshot`.

### Pendências antes de publicar

- Instalar dependências a partir do `package-lock.json` vigente.
- Executar `npm run build`.
- Executar `npm run lint` e classificar eventuais erros entre legado e regressão V19.
- Executar smoke do motor comercial: 1, 2 e 3 carrinhos; horas adicionais; consignação; garçons; descartáveis.
- Testar jornada completa localmente.
- QA visual em celular real.
- Validar PDF contra o resumo exibido.
- Configurar de forma segura as variáveis de envio na Vercel.
- Tratar os findings P0/P1 antes de considerar o fluxo automatizado como autoridade comercial.

### Baseline técnico V19 - primeira execução local

- `npm ci`: concluído com sucesso; 143 pacotes instalados, 144 auditados.
- O npm reportou 4 vulnerabilidades de alta severidade; ainda pendente relatório detalhado antes de qualquer correção automática.
- `npm run build`: concluído com sucesso no Windows/Vite 8.1.5; 123 módulos transformados.
- Build emitiu aviso de `src/styles/colors.css` vazio, sem interromper a compilação.
- `npm run lint`: falhou com 13 erros.
- Os erros foram classificados entre configuração de ambiente Node, dívida legada do site/Planner antigo e dois ajustes reais da V19.
- Preparada V19.3 para estabelecer baseline de lint sem alterar comportamento visual do site institucional.
- Próxima validação: substituir os arquivos completos da V19.3 e executar novamente `npm run build`, `npm run lint` e `git status --short`.


### QA visual e funcional V19

- V19 aberta localmente e navegada em fluxo real.
- Feedback: navegação de uma etapa por tela foi considerada promissora, porém a identidade visual perdeu punch e o Planner passou a parecer formulário convencional.
- Header perdeu contraste/legibilidade da marca.
- Validação sem data não explicava claramente por que a pessoa não avançava.
- Cardápio iniciava apenas Mini Lanches expandido sem critério.
- Etapa Ajustes preservou imagem/estrutura visual aprovada, mas regrediu a regra de personalização completa da recomendação.
- Botão de PDF abriu `about:blank` sem conteúdo.
- Tipografia editorial apresentou acento circunflexo visualmente estranho em “você”.

### V19.4 preparada

- Reforçada identidade Roda Festa sem abandonar a arquitetura mobile-first.
- Header redesenhado como faixa/capa vinho com logo creme e identificação “Meu Planner”.
- Papel recebeu linhas discretas, profundidade e detalhes dourados para recuperar linguagem de caderno.
- Todas as categorias do cardápio passam a iniciar recolhidas.
- Aviso de validação destacado criado para campos obrigatórios.
- Personalização completa reintroduzida: quantidade, trocar sabor, retirar item, adicionar item, retirar categoria e adicionar categoria.
- PDF migrado para abertura via Blob URL em vez de escrita posterior em `about:blank`.
- Documentação atualizada com RF-013 a RF-018.
- Sintaxe JSX validada com `@babel/parser` no ambiente de geração. Build/lint final devem ser repetidos no Windows antes de commit.

### Baseline verde V19.4 no Windows

- `npm run build`: verde, 123 módulos transformados; permanece apenas aviso de `src/styles/colors.css` vazio.
- `npm run lint`: verde, zero erros.
- Smoke crítico do motor: 3 carrinhos = R$ 900; 1 hora adicional para 3 carrinhos = R$ 450; total do cenário testado = R$ 1.627,50.
- Smoke anterior também confirmou 1 carrinho = R$ 300 e 2 carrinhos = R$ 600.

### QA mobile adicional - 2026-08-24

- Welcome V19.4 reprovado visualmente por perda da referência clássica marrom-escura e sofisticada.
- Confirmado bug de data anterior ao dia atual.
- Confirmado bug grave de responsividade nos controles de convidados em viewport estreito.
- Lógica financeira completa ainda não homologada; apenas smoke parcial de carrinhos/horas está verde.
- Requisito reforçado: a mesma via PDF gerada ao cliente deve chegar à Roda Festa e ficar armazenada/rastreável.

### V19.5 preparada para QA

- Welcome restaurado para linguagem clássica premium, mantendo a navegação de uma etapa por tela.
- Nome, telefone e data voltam para a capa; a etapa Evento fica focada em ocasião, convidados e duração, reduzindo sensação de formulário repetido.
- Data anterior a hoje passa a ser rejeitada também na lógica, com mensagem explícita.
- Controles de convidados recebem hardening responsivo para telas estreitas.
- Header e títulos internos ganham mais presença marrom/dourada sem voltar ao livro aberto antigo.
- RF-022 registra como P0 que a via interna ainda precisa receber o PDF canônico exato, e não apenas o snapshot.

### Checkpoint técnico V19.5 - 2026-08-24

- Build de produção validado com sucesso após aplicação da V19.5.
- `npm run lint` validado com zero erros.
- Smoke crítico do motor comercial permaneceu verde no cenário de 3 carrinhos + 1 hora adicional: carrinhos = R$ 900,00; hora adicional = R$ 450,00; total do cenário = R$ 1.627,50.
- Commit técnico criado na branch `planner/v19-mobile-first`.
- Commit: `46870b17f48c6dc36051971bf1a12267f4367d29`.
- Mensagem: `feat: refactor planner v19 mobile-first and harden commercial flow`.
- O checkpoint inclui a refatoração V19 mobile-first, baseline de lint, API de submissão, infraestrutura de snapshot, recuperação da personalização comercial, correções de PDF V19.4 e hardening visual/mobile V19.5.
- Permanecem deliberadamente fora desse checkpoint técnico os documentos de governança e fechamento, que serão registrados em commit documental separado.
- Próxima ação de fechamento: commit documental, confirmação de working tree limpa e somente então `npm run snapshot`.

## 2026-08-25 - Fundação comercial, histórica e Admin

### Direção de produto confirmada

- Cliente não deve ser obrigada a criar login para gerar proposta.
- Histórico deve funcionar por sessão server-side anônima, vinculável futuramente a telefone/e-mail e recuperável por link mágico/código.
- Admin será área separada no mesmo produto, com autenticação obrigatória e autorização server-side.
- Admin deve responder: entrada, sugestão original, alterações, final, PDF e pós-evento.
- Admin deve possuir agenda e tabela comercial versionada.
- Reconciliação financeira interna deve discriminar cada produto/serviço e fechar exatamente no orçamento final.
- Dados de festas reais serão solicitados quando a arquitetura estiver pronta para calibração; nenhum dado ausente será inventado.

### Unidade técnica iniciada

- Criado `commercialLedger.js` como representação financeira canônica.
- `calculateInvestment()` passa a derivar agregados e total do ledger reconciliado.
- Adicionadas versões `RF-REC-1.0.0`, `RF-COM-1.0.0` e `RF-PRICE-2026-08-24`.
- Criado `planningHistory.js` para congelar recomendação original e derivar mudanças relevantes até o final.
- `PlanningBook` passa a incluir recomendação original, delta, ledger e reconciliação no snapshot final.
- API de submissão passa a recalcular produtos/preços/carrinhos/serviços no servidor e rejeitar divergências comerciais.
- Criada suíte automatizada Node Test Runner para RF-001, consignação, horas adicionais, serviços, histórico e adulteração de payload.
- Criados documentos `ARCHITECTURE-PLANNER-ADMIN.md`, `TEST-MATRIX-COMMERCIAL.md` e `REAL-EVENT-CALIBRATION.md`.

### Próximas validações desta unidade

- `npm ci`;
- `npm test`;
- `npm run lint`;
- `npm run build`;
- revisão dos resultados;
- somente depois preparar pacote de atualização para aplicação no repositório oficial.

### Validação no ambiente de preparação

- `node --test tests/*.test.mjs`: 11/11 testes verdes.
- Cobertura inclui regra RF-001 no motor e no recálculo server-side, consignação, horas adicionais, ledger, garçons/descartáveis, adulteração de preço/total, lote comercial, calendário de São Paulo e delta recomendação x final.
- `node --check` verde para módulos JS novos/alterados de domínio e API.
- `npm ci` no ambiente de preparação excedeu o tempo disponível antes de concluir; portanto `npm run lint` e `npm run build` desta unidade devem ser executados no Windows oficial antes do commit técnico. Não interpretar essa limitação como validação verde de build/lint.

### Checkpoint técnico V19.6 - 2026-08-25

- Pacote V19.6 aplicado pelo novo fluxo padronizado de atualização local.
- `npm test`: 11 testes executados, 11 aprovados, 0 falhas.
- `npm run lint`: verde, zero erros.
- `npm run build`: verde; 125 módulos transformados. Permanece somente o aviso conhecido de `src/styles/colors.css` vazio.
- Commit técnico criado: `c0f69ec134a7a2d7d698241959274d4cb3ece071`.
- Mensagem: `feat: add commercial ledger, history tracking and regression tests`.
- A unidade consolida Commercial Ledger canônico, histórico recomendação x final, recálculo server-side e regressões comerciais automatizadas.
- Próxima unidade arquitetural: PlanningSession server-side e persistência durável, antes de construir a Central Admin visual.
- A documentação desta unidade será commitada separadamente após registrar o hash técnico, mantendo a regra de reconciliação antes de snapshot.

### V19.7A - Fundacao desacoplada de PlanningSession

- A tentativa de reativar o projeto Supabase do Roda Festa revelou limite de projetos gratuitos ativos.
- Foi decidido nao pausar, reutilizar ou alterar `simplify` nem `simplify-runtime-security`; infraestrutura do Simplify permanece independente e protegida.
- A V19.7 original nao foi aplicada ao repositorio oficial.
- A unidade foi reformulada como V19.7A, sem ativacao de banco e sem alteracao do fluxo atual da cliente.
- Criado contrato provider-agnostic de repositorio de `PlanningSession`.
- Criado adapter em memoria para testes, sem permissao para funcionar como fallback silencioso de producao.
- Criado adapter Supabase isolado, fail-high sem configuracao.
- Criadas primitivas de seguranca para token anonimo, hash, cookie e validacao de origem.
- Migration `20260825_v19_7_planning_sessions.sql` foi versionada, mas nao executada.
- Nenhum secret foi solicitado, documentado ou commitado.

### Validacao oficial V19.7A no Windows

- `npm test`: 20 testes executados, 20 aprovados, 0 falhas.
- `npm run lint`: verde, zero erros.
- `npm run build`: verde, 125 modulos transformados.
- Permanece apenas o aviso conhecido de `src/styles/colors.css` vazio.
- Cobertura nova inclui idempotencia, ownership, concorrencia/finalizacao, token/hash, cookie seguro, origem confiavel e comportamento fail-high do adapter Supabase.
- Commit tecnico: `452be928190ad66b924a710f12d98d2b1a6f3964`.
- Mensagem: `feat: add provider-agnostic planning session persistence foundation`.
- Working tree confirmada limpa apos o commit tecnico.
- Proxima acao: commit documental desta reconciliacao; depois integrar gradualmente PlanningSession ao Planner sem banco remoto.

### V19.7C - PlanningChange / timeline explicável

- Unidade aplicada sobre a base documental e técnica limpa da V19.7B.
- Criada timeline de mudanças comercialmente relevantes entre recomendação e proposta final.
- Eventos passam a ser append-only, ordenados e protegidos por ownership e versão.
- Ator e timestamp são normalizados no servidor.
- Cliente envia mudanças em batch com cookie same-origin e versão otimista.
- API rejeita tipos, produtos e ownership inválidos.
- Novas mudanças são bloqueadas após finalização.
- A timeline não substitui o cálculo autoritativo de preço/estrutura/total.

### Validação oficial V19.7C no Windows

- `npm test`: 38 testes executados, 38 aprovados, 0 falhas.
- `npm run lint`: verde, zero erros.
- `npm run build`: verde, 126 módulos transformados.
- Permanece apenas o aviso conhecido de `src/styles/colors.css` vazio.
- `git diff --cached --check` detectou apenas uma linha em branco extra no EOF da migration; normalização aplicada sem mudança funcional e check final limpo.
- Commit técnico: `a9e6bf89e1e8799a0d9625a9e2731a624f4c447b`.
- Mensagem: `feat: add append-only planning change timeline`.
- Working tree confirmada limpa após o commit técnico.
- Persistência remota continua desligada e nenhuma migration foi executada.

## 2026-08-25 — V19.7D Journey Read Model

Checkpoint técnico fechado em `ce536b4ec42824eb904fdb4fcfb1353c4a2105eb` (`feat: add explainable planning journey read model`).

Sequência de validação:
1. V19.7D aplicada com persistência remota desligada e sem migration.
2. Primeira suíte: 41/41 testes verdes; lint RED por integração incompleta.
3. Hotfix V19.7D1: conexão efetiva do read path e regressões de ownership/same-origin.
4. Nova suíte: 42/43; RED funcional mostrou incompatibilidade entre `snake_case` persistido e `camelCase` esperado.
5. Hotfix V19.7D2: read model passou a aceitar ambos os shapes e ganhou regressão dedicada.
6. Validação final: 44/44 testes, lint verde, build verde.
7. Commit técnico criado e working tree confirmada limpa.

Nenhuma persistência remota foi ativada e nenhuma migration foi executada.

## 2026-08-25 — V19.7E Admin Journey Query

Checkpoint técnico fechado em `2852f946e2f9430afdc247f093ba2c421c035ecb` (`feat: add admin-ready planning journey query contract`).

- aplicação adicionou somente 3 arquivos;
- nenhum endpoint administrativo foi criado;
- nenhum banco remoto foi ativado;
- nenhuma migration foi executada;
- suíte acumulada: 48/48;
- lint: verde;
- build: verde;
- working tree limpa após o commit.

## 2026-08-25 — V19.7F Admin Authorization Boundary

Checkpoint técnico fechado em `58bba0cb009d2823efa65d615fe9799990e74924` (`feat: add admin authorization boundary`).

- V19.7F aplicada sobre working tree limpa;
- apenas 3 arquivos novos;
- suíte acumulada: 55/55;
- lint: verde;
- build: verde;
- nenhum login real;
- nenhum endpoint Admin global;
- nenhum banco remoto;
- nenhuma migration;
- commit técnico criado;
- working tree confirmada limpa após o commit.

## 2026-08-25 — V19.7G Admin Authentication Contract

Checkpoint técnico fechado em `2e08ee32042de8cd5614091a49371975b7761c37` (`feat: add admin authentication contract`).

- base inicial: `ddc6caec202c037d8e7b0cf2d11aa82a18e44c6d`;
- V19.7G aplicada sobre working tree limpa;
- exatamente 3 arquivos novos;
- suíte acumulada: 63/63;
- lint: verde;
- build: verde;
- nenhum login real;
- nenhum secret;
- nenhum endpoint Admin global;
- nenhum banco remoto;
- nenhuma migration;
- commit técnico criado;
- working tree confirmada limpa após o commit.

## 2026-08-25 — V19.7H Admin Session Repository

Checkpoint técnico fechado em `eb1713d82f937ceaf0dbe94f736336cff3a8e135` (`feat: add admin session repository`).

- base inicial: `8c629305d268d29c71e87765bb45f0f084b9d3bd`;
- V19.7H aplicada sobre working tree limpa;
- exatamente 4 arquivos novos;
- suíte acumulada: 72/72;
- lint: verde;
- build: verde;
- token bruto não persistido;
- expiração, revogação e rotação cobertas por testes;
- adapter de memória bloqueado em produção por padrão;
- nenhum login real;
- nenhum secret;
- nenhum endpoint Admin global;
- nenhum banco remoto;
- nenhuma migration;
- commit técnico criado;
- working tree confirmada limpa após o commit.

## 2026-08-25 — V19.7I Admin Authentication Composition

Checkpoint técnico fechado em `b9b847c0ebf117451ae25a2aa2e1309ccd505d8c` (`feat: compose admin authentication session and authorization`).

- base inicial: `874d734c5e69c3d49d245bb3b328d063d2394c89`;
- V19.7I aplicada sobre working tree limpa;
- exatamente 3 arquivos novos;
- suíte acumulada: 82/82;
- lint: verde;
- build: verde;
- Authentication Contract, Session Repository e Authorization Boundary compostos server-side;
- tentativa de forjar role/capabilities coberta por regressão;
- expiração, revogação e rotação cobertas de ponta a ponta;
- token bruto e tokenHash não expostos;
- nenhum login visual;
- nenhum secret;
- nenhum endpoint Admin global;
- nenhum banco remoto;
- nenhuma migration;
- commit técnico criado;
- working tree confirmada limpa após o commit.

## 2026-08-25 — V19.7J Admin Authentication HTTP Boundary

Checkpoint técnico fechado em `3334f7444650b2d93001e1f7d9bd75ec0251d0ef` (`feat: add admin authentication http boundary`).

- base inicial: `16ad59fa34b1e877faec341b721b146af27e0c74`;
- V19.7J aplicada sobre working tree limpa;
- exatamente 3 arquivos novos;
- suíte acumulada: 92/92;
- lint: verde;
- build: verde;
- login/logout/refresh HTTP implementados;
- Origin e POST-only cobertos;
- logout revoga sessão;
- refresh rotaciona token;
- role/capabilities fornecidas pelo cliente não são confiadas;
- token bruto, tokenHash e credential não são expostos;
- nenhum login visual;
- nenhum secret;
- nenhum endpoint Admin global;
- nenhum banco remoto;
- nenhuma migration;
- commit técnico criado;
- working tree confirmada limpa após o commit.

## 2026-08-25 — V19.7K Admin Login Shell

Checkpoint técnico: `5381ffc5de873781b6e976de53537b98190837ca` (`feat: add admin login shell`).

A unidade foi aplicada sobre árvore limpa após restaurar `src/planner.zip`, cuja deleção local acidental havia sido detectada pelo guard do pacote.

Validação automatizada:
- 96/96 testes;
- lint verde;
- build verde.

Validação manual:
- Vite exposto na rede local;
- endereço de rede atualizado para `192.168.0.124:5173`;
- `/admin` acessado com sucesso em iPhone;
- formulário preenchido;
- botão `Entrar` exibiu corretamente a mensagem de que credenciais reais ainda não estavam ativadas.

Decisão de produto:
- funcionalidade aprovada para este estágio;
- placeholder `RF` e acabamento visual não bloqueiam a evolução;
- branding/logo oficial será refinado posteriormente.

Após o commit técnico, `git status --short` ficou sem saída.

## 2026-08-26 — V19.7L Admin Credential Verification Contract

Checkpoint técnico fechado em `4103e39b99b36bce9381a6d1a590a772cb90533d` (`feat: add admin credential verification`).

- base inicial: `873d3bf5129f92f0bb8b9238871be9470f36c713`;
- V19.7L aplicada sobre working tree limpa;
- exatamente 3 arquivos novos;
- suíte acumulada: 106/106;
- lint: verde;
- build: verde;
- verifier server-side criado;
- `scrypt` + salt adotados;
- usuário inexistente e senha incorreta tratados de forma neutra;
- conta inativa bloqueada;
- role/capabilities derivadas do registro confiável;
- hash/salt/credential não expostos;
- nenhum usuário/senha real;
- nenhum secret;
- nenhum endpoint HTTP novo;
- nenhum banco remoto;
- nenhuma migration;
- commit técnico criado;
- working tree confirmada limpa após o commit.

## 2026-08-26 — V19.7M Admin Login Composition

Checkpoint técnico fechado em `0b474af7a12871fa56dcd01a1da71056b0fa773e` (`feat: compose admin login`).

- base inicial: `2595fae419116560b57dda5ae9af2f3cd2c7e0bb`;
- V19.7M aplicada sobre working tree limpa;
- exatamente 3 arquivos novos;
- suíte acumulada: 111/111;
- lint: verde;
- build: verde;
- verifier server-side conectado à HTTP Boundary por composição dedicada;
- request do cliente não pode substituir a dependência de verificação;
- resposta da boundary preservada sem exposição de dependências;
- nenhum usuário/senha real;
- nenhum secret;
- nenhum endpoint HTTP novo;
- nenhum `fetch` no frontend;
- nenhum banco remoto;
- nenhuma migration;
- commit técnico criado;
- working tree confirmada limpa após o commit.

## 2026-08-26 — V19.7M1 Real Boundary Composition Fix

Checkpoint técnico fechado em `7f43a827e5ead6e63d10022412e08130ddfb479b` (`fix: align admin login composition with real http boundary`).

- base inicial: `be1634d416f7ef58e7f49ed740bcd5cd317d5e79`;
- incompatibilidade de interface identificada antes da criação do endpoint V19.7N;
- `admin-login-composition.js` corrigido;
- testes unitários da composição atualizados;
- novo teste de integração real adicionado;
- integração credencial → verifier → boundary → sessão → cookie comprovada;
- credencial incorreta não cria sessão;
- Origin continua protegido antes da autenticação;
- suíte acumulada: 114/114;
- lint: verde;
- build: verde;
- nenhum usuário/senha real;
- nenhum secret;
- nenhum endpoint HTTP novo;
- nenhum `fetch` no frontend;
- nenhum banco remoto;
- nenhuma migration;
- working tree confirmada limpa após o commit.

## 2026-08-26 — V19.7N Admin Login HTTP Endpoint

Checkpoint técnico fechado em `640100e906652d98c725ac1e9d13ba48842062ed` (`feat: add admin login http endpoint`).

- base inicial: `76c12605273d03addf3aa5282c290935870ee4cf`;
- endpoint `api/admin-login.js` criado;
- exatamente 3 arquivos novos;
- resposta HTTP adaptada para a composição Admin;
- `Set-Cookie` transportado;
- erros públicos controlados;
- erro interno inesperado não vaza detalhes;
- handler padrão permanece 503 fail-closed;
- suíte acumulada: 121/121;
- lint: verde;
- build: verde;
- nenhum usuário/senha real;
- nenhum secret;
- nenhum `fetch` no frontend;
- nenhum banco remoto;
- nenhuma migration;
- working tree confirmada limpa após o commit.

## 2026-08-26 — V19.7O Vercel API Routing Boundary

Checkpoint técnico fechado em `bbd9ddf422822890d296216e33b12223b606760f` (`fix: preserve vercel api routing before spa fallback`).

- base inicial: `7747c475e7ae6a5f32ddcb7057beacee476f2094`;
- `vercel.json` ajustado para preservar `/api/*`;
- fallback SPA mantido depois da API;
- teste de ordem e isolamento adicionado;
- nenhuma configuração legada `builds` ou `routes`;
- suíte acumulada: 124/124;
- lint: verde;
- build: verde;
- nenhum runtime real;
- nenhum usuário/senha real;
- nenhum secret;
- nenhum `fetch` no frontend;
- nenhum banco remoto;
- nenhuma migration;
- working tree confirmada limpa após o commit.

## 2026-08-26 — V19.7P Admin Supabase Persistence Adapters

Checkpoint técnico fechado em `8db1e991f62329da29fc580ec79d5a776c9d241b` (`feat: add admin supabase persistence adapters`).

- base inicial: `9e1a2ef235906201958db4095a528546bff6ebfb`;
- exatamente 5 arquivos novos;
- identity store Supabase criado;
- session adapter Supabase criado;
- lookup por identificador normalizado;
- criação, resolução, revogação e rotação de sessão;
- somente token hash persistido;
- service role restrita ao servidor;
- erros sanitizados;
- suíte acumulada: 136/136;
- lint: verde;
- build: verde;
- nenhuma migration;
- nenhuma tabela remota criada;
- nenhum usuário/senha real;
- nenhum hash real de usuário;
- nenhum secret;
- nenhum wiring de runtime;
- nenhum `fetch` no frontend;
- working tree confirmada limpa após o commit.

## 2026-08-26 — V19.7Q Admin Runtime Composition

Checkpoint técnico fechado em `ea839646658293301b812006dff7adc5a6438329` (`feat: compose persistent admin runtime`).

- base inicial: `ff160acb678cd786bef02d9ec55bbe83eacfe4a4`;
- exatamente 3 arquivos novos;
- runtime Admin persistente criado;
- identity store conectado ao verifier;
- session adapter conectado ao repository;
- authorization boundary conectada à authentication composition;
- login composition fechando a cadeia;
- fail-high sem Supabase;
- sem fallback para memória;
- service-role não exposta publicamente;
- teste integrado ponta a ponta aprovado;
- suíte acumulada: 142/142;
- lint: verde;
- build: verde;
- endpoint ainda não ativado;
- nenhuma migration;
- nenhuma tabela remota criada;
- nenhum usuário/senha real;
- nenhum hash real;
- nenhum secret versionado;
- nenhum `fetch` no frontend;
- working tree confirmada limpa após o commit.

## 2026-08-26 — V19.7R Admin Login Runtime Wiring

Checkpoint técnico fechado em `ff5f597dd40ed6f31a95d99d14c2cf3012dc026c` (`feat: wire admin login endpoint to persistent runtime`).

- base inicial: `fcd6816cf6fe7c077a0bd68bcf066c452980d0bb`;
- `api/admin-login.js` alterado;
- 2 arquivos novos;
- endpoint ligado ao runtime persistente;
- env/fetch injetados apenas server-side;
- indisponibilidade retorna 503 neutro;
- runtime inválido falha fechado;
- cookie seguro preservado;
- suíte acumulada: 147/147;
- lint: verde;
- build: verde;
- nenhuma migration;
- nenhuma tabela remota criada;
- nenhum usuário/senha real;
- nenhum hash real;
- nenhum secret versionado;
- formulário visual ainda não ligado ao endpoint;
- working tree confirmada limpa após o commit.

## 2026-08-26 — V19.7S Admin Persistence Schema Contract

Checkpoint técnico fechado em `e969d23880aaf805c609255511b60b916aab5e67` (`feat: define admin persistence schema contract`).

- base inicial: `8e90d11ada723b8b745e92708d071a4c90e8dbd2`;
- exatamente 3 arquivos novos;
- contrato SQL Admin versionado;
- `admin_users` e `admin_sessions` especificados;
- senha bruta ausente;
- token bruto ausente;
- identificador e token hash únicos;
- constraints temporais e versionamento definidos;
- RLS habilitado;
- privilégios de `anon` e `authenticated` removidos;
- nenhuma policy aberta;
- suíte acumulada: 154/154;
- lint: verde;
- build: verde;
- nenhuma execução SQL remota;
- nenhuma migration aplicada;
- nenhuma tabela remota criada;
- nenhum usuário/senha real;
- nenhum hash/salt real;
- nenhum secret;
- runtime inalterado;
- working tree confirmada limpa após o commit.

## 2026-08-26 — V19.7T Admin Persistence Materialization Guard

Checkpoint técnico fechado em `5800452fbedf5a7bdf07d48e31500ba5feba2a12` (`feat: add admin persistence materialization guard`).

- base inicial: `6b0e38a4ee6bc538291fc8f20f8c02c61116d68d`;
- exatamente 3 arquivos novos;
- guard SQL read-only criado;
- preflight de existência definido;
- postflight de RLS/policies/grants/índices definido;
- falso positivo do teste read-only identificado;
- SQL não foi alterado;
- teste corrigido para ignorar comentários SQL;
- suíte acumulada: 161/161;
- lint: verde;
- build: verde;
- nenhuma Supabase CLI instalada;
- nenhuma execução SQL remota;
- nenhuma migration aplicada;
- nenhuma tabela remota criada;
- nenhum usuário/senha real;
- nenhum secret;
- working tree confirmada limpa após o commit.

## 2026-08-26 — V19.7U — Materialização real do schema Admin

Partindo de `402766613e84354a43cfbd736511d688b9a162a2` com working tree limpa: projeto Supabase Roda Festa confirmado; preflight com 2/2 tabelas ausentes; contrato executado com sucesso; postflight com 2/2 tabelas, RLS 2/2 `true`, zero policies, zero grants `anon`/`authenticated` e 4/4 índices. Primeiro Admin não criado. HEAD local permaneceu `402766613e84354a43cfbd736511d688b9a162a2` e a working tree permaneceu limpa após a operação remota.

## 2026-08-26 — V19.7V

Checkpoint técnico `e935a474f09f2466c7fda18678d2684084b4e1e3` (`feat: add secure first admin bootstrap provisioning`).

- 4 arquivos novos;
- 7 testes novos;
- baseline 168/168;
- lint verde;
- build verde;
- gerador sem escrita remota;
- senha não trafega por argv;
- SQL sensível destinado somente ao diretório temporário;
- nenhum Admin real provisionado;
- nenhuma credencial real documentada;
- working tree limpa após o commit.

## 2026-08-26 — V19.7W — Primeiro Admin real

Partindo do checkpoint `2edd24c560becdcad58b730b010d4de0b43ebb16` e com working tree limpa:

- `admin_count` pré-bootstrap: 0;
- bootstrap one-time gerado localmente;
- senha permaneceu apenas no terminal;
- SQL temporário executado no Supabase com sucesso;
- arquivo temporário apagado e confirmado `APAGADO`;
- `admin_count` pós-bootstrap: 1;
- `role`: OWNER;
- `active`: true;
- HEAD local permaneceu `2edd24c560becdcad58b730b010d4de0b43ebb16`;
- working tree permaneceu limpa;
- prova funcional de login real ainda pendente.

## 2026-08-26 — V19.7X

Partindo de `85af4708f436f0533ed83edcf869ee915018cd25` e com working tree limpa: smoke temporário fora do repositório; URL e credenciais fornecidas somente localmente; login real OK; role OWNER; cookie OK; persistência Supabase OK; nenhum secret exibido.

## 2026-08-26 — V19.7Y

Checkpoint técnico `40b1a8f6173d1597bbbc68ec2042454d674ffcab` (`feat: wire admin browser login to real endpoint`).

- 5 arquivos no commit;
- formulário `/admin` ligado a `/api/admin-login`;
- teste legado reconciliado sem regredir o código funcional;
- 175/175 testes;
- lint verde;
- build verde;
- working tree limpa após commit;
- layout Admin ainda não aprovado visualmente;
- arquivamento de orçamentos mantido no radar para futura unidade correlata.

## 2026-08-26 — V19.7Z

Checkpoint técnico `145345bcd55a7720adaa79167b67dca0299a67dc` (`feat: restore admin session on browser reload`).

- 7 arquivos no commit;
- criado `GET /api/admin-session`;
- `AdminLogin` passa a consultar sessão ao montar;
- cookie continua HttpOnly e fora do JavaScript;
- testes legados reconciliados sem regredir a implementação;
- 184/184 testes;
- lint verde;
- build verde;
- working tree limpa após commit;
- prova real de reload no Preview ainda pendente.

## 2026-08-26 — V19.7ZA

Checkpoint técnico `ccf21c72b88af85cab27828a917d5cddeea7daf5` (`fix: widen admin session cookie path for restore`).

- 6 arquivos no commit;
- cookie Admin alterado de `Path=/admin` para `Path=/`;
- logout/clear alinhado ao mesmo path;
- teste real legado reconciliado;
- novo teste de regressão para path do cookie;
- 187/187 testes;
- lint verde;
- build verde;
- working tree limpa após commit;
- smoke de navegador ainda pendente.

## 2026-08-26 — Smoke real V19.7ZA

Prova real concluída no Preview.

Fluxo:
- novo login realizado;
- sessão ativa confirmada;
- `Ctrl+R`;
- sessão permaneceu autenticada;
- frontend exibiu `Sessão administrativa restaurada com segurança.`

Resultado: V19.7ZA aprovada em navegador real.

Próxima unidade de produto: Admin de Orçamentos.

## 2026-08-26 — Fechamento V19.8A–V19.8C

### V19.8A — Admin de Orçamentos read-only

Checkpoint técnico `75997c4d552ff45a5cd1811e734655d139a3ccf2` (`feat: add admin quotes read workspace`).

- criado workspace Admin visual para leitura de orçamentos;
- criado `GET /api/admin-quotes`, protegido pela autenticação Admin;
- criado store server-side para leitura de `planning_sessions`;
- lista e detalhe preservam snapshots históricos e não recalculam propostas antigas;
- fluxo “Novo orçamento” aponta para o Planning em contexto administrativo;
- validação oficial da unidade: 199/199 testes, lint verde e build verde;
- primeiro smoke real revelou `{"ok":false,"error":"admin_quotes_unavailable"}`.

### Diagnóstico e materialização de PlanningSession no Supabase

O smoke real do Admin mostrou que `public.planning_sessions` ainda não existia no projeto Supabase do Roda Festa.

Diagnóstico executado no SQL Editor:
- `to_regclass('public.planning_sessions')` retornou `NULL`;
- migration versionada `infra/migrations/20260825_v19_7_planning_sessions.sql` foi executada;
- após execução, `to_regclass` passou a retornar `planning_sessions`;
- RLS foi verificado como `true`;
- contagem inicial verificada em `0`;
- `/api/admin-quotes` passou de `admin_quotes_unavailable` para `{"ok":true,"quotes":[]}`.

Observação de governança: existência, RLS e contagem foram verificadas manualmente. Policies, grants e índices da tabela `planning_sessions` não receberam um postflight independente nesta sessão; permanecem cobertos pela migration versionada e devem ser incluídos em futura verificação de infraestrutura.

### V19.8B — identidade Admin e navegação Admin ↔ Planning

Checkpoint técnico `6939a37eb953e8c1d2973f757a5f10e0b35afa25` (`feat: refine admin theme and planning return flow`).

- direção visual Admin aprovada: marrom escuro + creme + dourado;
- login e workspace Admin alinhados à identidade do Planning;
- restauração de sessão passa a usar shell neutro “Verificando sessão segura...” antes do formulário, eliminando o flash visual de login;
- Planning reconhece `?admin=1&return=/admin`;
- barra persistente “Modo administrativo” adicionada;
- ação “Voltar ao Admin” disponível durante a jornada;
- return path limitado a caminho interno seguro;
- validação oficial: 203/203 testes, lint verde e build verde;
- smoke real no Preview: navegação Admin → Planning → Admin aprovada sem defeitos funcionais.

### V19.8C — Planning Brown Theme

Checkpoint técnico `d14374238e18e6545caee8faeb6850797cb51d79` (`style: align planning with approved brown theme`).

- tokens primários do Planning migrados do vinho antigo para o marrom aprovado;
- welcome, header interno, progresso, botões, foco e seleção passam a compartilhar a mesma identidade marrom/creme/dourado;
- nenhuma alteração no motor, persistência, endpoints ou navegação;
- teste focal V19.8C: 3/3;
- suíte acumulada oficial: 206/206;
- lint verde;
- build verde;
- permanece apenas o warning conhecido de `src/styles/colors.css` vazio.

### Provas e pendências ao encerrar o dia

Aprovado em navegador real:
- login Admin real;
- restauração de sessão após reload;
- Admin de Orçamentos carregando estado vazio após materialização de `planning_sessions`;
- navegação Admin ↔ Planning;
- direção visual marrom/creme/dourado.

Pendente para a próxima sessão:
- resolver acesso ao Preview pelo celular: atualmente a tela “Log in to Vercel” intercepta o acesso antes da aplicação; é uma proteção da plataforma Vercel, não do login Roda Festa;
- executar primeiro orçamento real após a tabela `planning_sessions` existir;
- comprovar persistência da jornada e aparição do orçamento no Admin;
- comparar sugestão original → alterações → proposta validada;
- somente depois começar calibração controlada do motor com histórico real;
- manter aprendizado controlado: histórico não altera o motor automaticamente.

## 2026-08-27 — Reconciliação da prova de acesso mobile ao Preview

Após o checkpoint documental `e711ced16d9a14794a3d510680a8839a4ccc7ede`, foi realizada prova operacional que ainda não constava nos documentos versionados:

- criado Shareable Link da Vercel para o Preview;
- acesso comprovado em celular fora do Wi-Fi da empresa;
- o Shareable Link permitiu carregar o Roda Festa sem a interceptação anterior “Log in to Vercel”;
- o link inicialmente abriu o Planning;
- a rota `/admin` também foi alcançada;
- nenhuma alteração insegura foi feita na autenticação própria do Admin para obter esse resultado.

Com isso, o bloqueio operacional de acesso mobile ao Preview fica encerrado para a fase de desenvolvimento.

Permanecem como próximas unidades:
- planejar publicação estável para uso cotidiano autorizado;
- provisionar corretamente usuário ADMIN individual para Adrielly, sem reutilizar o bootstrap do primeiro OWNER;
- executar postflight independente de `planning_sessions`;
- realizar o primeiro orçamento real persistido ponta a ponta;
- preservar a cadeia de snapshots e alterações humanas para futura análise/calibração controlada do motor.

## 2026-08-27 — Postflight real de planning_sessions no Supabase

Foi executada uma sequência de consultas somente de leitura no SQL Editor do Supabase para validar o estado materializado de `public.planning_sessions`.

Resultados:
- tabela existente;
- RLS habilitado (`true`);
- `rls_forced = false`, coerente com a migration atual e não tratado como falha neste checkpoint;
- nenhuma policy retornada;
- `anon` sem SELECT/INSERT/UPDATE/DELETE;
- `authenticated` sem SELECT/INSERT/UPDATE/DELETE;
- grants visíveis apenas para papéis administrativos/server-side;
- 7 índices presentes;
- 2 triggers presentes;
- 5 constraints presentes;
- contagem atual: 0.

Nenhum INSERT, UPDATE, DELETE ou DDL foi executado durante o postflight.

Resultado: GREEN estrutural independente de `planning_sessions`.

Ainda pendente:
- primeiro orçamento real persistido;
- confirmação de transição da contagem 0 para 1;
- prova de snapshots, mudanças e proposta final;
- leitura do mesmo caso pelo Admin;
- documentação da jornada real para futura calibração controlada do motor.


## 2026-08-27 — Preparação da Production canônica e suporte à Supabase Secret Key moderna

A preparação para unificar o Roda Festa em uma referência operacional canônica avançou sem deployment Production nesta etapa.

Infraestrutura/configuração confirmada:
- Project Ref canônico Supabase: `ezccivmuvlqvzhojnoxn`;
- tabelas `planning_sessions`, `admin_users` e `admin_sessions` existentes;
- Vercel Production recebeu `SUPABASE_URL`;
- Vercel Production recebeu a Secret Key moderna de backend sob o nome histórico `SUPABASE_SERVICE_ROLE_KEY`;
- nenhum valor secreto foi versionado ou registrado na documentação.

Antes de ativar Production, foi identificado que quatro adapters REST ainda reutilizavam a chave Supabase como `Authorization: Bearer`. Foi aplicado pacote controlado sobre a base `4e2a6b6c5997188ad1782098a1902001480ea3a2`, criando helper central compatível com chave moderna e legacy.

Validação executada pelo `validate-update.cmd`:
- teste focal da autenticação Supabase: 4/4;
- suíte completa: 210/210;
- lint: verde;
- build: verde;
- higiene do diff: verde;
- apenas os 6 arquivos previstos participaram da unidade.

Checkpoint técnico criado na branch `planner/v19-mobile-first`:
`ff0f223943990ed24fe9dac0015dd953ca33d123` — `security: support modern Supabase secret keys`.

A working tree ficou limpa imediatamente após o checkpoint técnico.

Contexto funcional preservado para a próxima prova:
- o Supabase canônico já contém 1 `planning_session` real;
- essa sessão está `FINALIZED`;
- o Admin Preview anteriormente respondeu `{"ok":true,"quotes":[]}` e permaneceu vazio;
- não foi comprovado mismatch de projeto Supabase, portanto o diagnóstico será retomado somente após a Production canônica reduzir a ambiguidade de ambiente.

Nenhum merge em `main`, push deste checkpoint ou deployment Production foi realizado nesta unidade antes da reconciliação documental.
