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
