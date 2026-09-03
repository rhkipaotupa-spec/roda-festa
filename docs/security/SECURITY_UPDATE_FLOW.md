# SECURITY UPDATE FLOW — Roda Festa

Estado: **OBRIGATÓRIO para novas atualizações**

Origem: auditoria de segurança concluída em 03/09/2026 sobre o baseline `78cd386d5a80ac49a76c8a685e7633f776e587c8`.

Este documento não altera comportamento de produto. Ele define os gates mínimos de segurança que passam a fazer parte do fluxo normal de atualização do Roda Festa.

## 1. Princípio

Nenhuma alteração deve chegar a `main` apenas porque testes funcionais passaram. Cada atualização deve preservar explicitamente:

- isolamento de dados;
- autorização server-side;
- proteção contra IDOR;
- ausência de segredos no código/bundle/configuração;
- tratamento seguro de inputs e HTML;
- capacidade de recuperação e rollback já estabelecida pelo DR.

Os gates abaixo são proporcionais ao escopo da mudança. Quando uma categoria não for afetada, registrar como **N/A com justificativa**, em vez de ignorá-la silenciosamente.

## 2. Fluxo obrigatório

### Gate 0 — Baseline seguro

Antes de começar:

1. partir de `main` atualizada e working tree limpa;
2. confirmar `HEAD == origin/main`;
3. criar branch isolada;
4. registrar o commit-base da unidade;
5. não usar `main` para experimentação;
6. não usar comandos destrutivos como `git reset --hard`;
7. não incluir segredos em chat, Git, documentação ou artefatos de teste.

### Gate 1 — Classificação de impacto de segurança

Antes da implementação, marcar quais superfícies a mudança toca:

- [ ] autenticação/sessão;
- [ ] autorização/papéis/capabilities;
- [ ] rota/API por ID;
- [ ] leitura/listagem/agregação/exportação;
- [ ] Supabase/migration/RLS/grants/RPC;
- [ ] inputs do usuário;
- [ ] HTML/e-mail/PDF/template/markdown;
- [ ] variáveis de ambiente/segredos;
- [ ] frontend bundle;
- [ ] deploy/CI;
- [ ] dados de Production.

Qualquer item marcado exige os gates específicos correspondentes abaixo.

## 3. Gates por categoria

### S1 — Banco e isolamento de dados

Para qualquer mudança em banco, adapter, query, listagem, busca, relatório, exportação ou agregação:

1. confirmar qual é o mecanismo de isolamento aplicável;
2. no estado atual do Roda Festa, as tabelas server-side usam RLS habilitado, sem policies para `anon`/`authenticated`, com acesso somente server-side por `service_role`;
3. novas tabelas públicas devem nascer com RLS habilitado e grants mínimos;
4. não criar policy permissiva para `anon`/`authenticated` sem justificativa explícita e teste;
5. queries de jornada pública por ID devem preservar posse pelo token opaco da PlanningSession;
6. queries administrativas devem permanecer atrás da autenticação/autorização do Admin;
7. migration ou intervenção em dados exige backup adicional antes e depois, conforme política DR;
8. executar os testes de segurança aplicáveis e revisar Supabase Security Advisor após DDL relevante.

**Bloqueante:** qualquer acesso direto indevido por `anon`/`authenticated`, perda de RLS esperada ou query de objeto sem o isolamento definido.

### S2 — Autorização server-side

Para qualquer nova tela administrativa, botão privilegiado, configuração ou escrita:

1. não aceitar ocultação de UI como controle de segurança;
2. identificar o endpoint chamado pela UI;
3. exigir autenticação no backend;
4. exigir autorização no backend com role/capability apropriada;
5. testar chamada direta ao endpoint sem sessão e com sessão sem privilégio;
6. o backend deve negar independentemente do que o frontend mostra.

**Bloqueante:** operação privilegiada protegida apenas no navegador.

### S3 — Sessões administrativas e revogação de privilégios

A auditoria de 03/09/2026 confirmou um risco real: uma sessão Admin já emitida podia continuar usando `role`/`capabilities` armazenadas em `admin_sessions` mesmo após a identidade em `admin_users` ser desativada ou rebaixada.

A unidade P1 implementa o fechamento por **revalidação da identidade atual em toda autenticação de sessão Admin**:

- a sessão opaca continua sendo validada por token, revogação e expiração;
- em seguida o servidor consulta `admin_users` pelo `userId` confiável da sessão;
- `active=false`, identidade ausente ou identidade incompatível invalidam a autenticação;
- `role` e `capabilities` usados pela autorização são reconstruídos a partir do registro atual de `admin_users`, e não do snapshot antigo da sessão;
- falha no lookup de identidade permanece fail-closed;
- nenhuma credencial é revalidada a cada request e nenhum segredo novo é exposto.

Critério mínimo para fechamento:

- [x] sessão existente deixa de autorizar imediatamente após `active=false` no usuário;
- [x] redução de role/capability não permanece válida em sessão antiga;
- [x] testes RED → GREEN cobrem desativação e downgrade de papel/capability;
- [x] regressões de revogação, rotação e expiração continuam cobertas pela suíte existente;
- [x] login/logout/refresh e endpoints Admin continuam cobertos pela suíte integral;
- [ ] merge aprovado e reconciliação pós-merge concluídos.

A correção só é considerada definitivamente fechada em Production depois do último item acima.

### S4 — IDOR

Para **todo** handler novo ou alterado que aceite ID em path, query ou body:

1. identificar o objeto acessado;
2. identificar quem pode possuí-lo/acessá-lo;
3. validar posse/tenant/escopo no servidor antes de ler, alterar ou apagar;
4. não confiar em ID vindo da UI;
5. criar teste negativo com ID válido pertencente a outro contexto/sessão;
6. para PlanningSession pública, preservar filtro conjunto `sessionId + tokenHash` nas leituras e escritas;
7. para Admin, o acesso por ID deve permanecer atrás da fronteira administrativa server-side.

**Bloqueante:** objeto acessível apenas por conhecer/adivinhar seu ID.

### S5 — Segredos e configuração

Em toda atualização:

1. não hardcodar API key, token, senha, secret, private key, webhook secret, connection string privilegiada ou chave de backup;
2. não usar fallback público que possa virar segredo real, como `${VAR:-segredo}`;
3. configurações privilegiadas devem falhar fechado quando ausentes;
4. `.env`, `.env.*` e arquivos locais sensíveis permanecem fora do Git;
5. revisar scripts, docs, workflow CI e configs de deploy modificadas;
6. quando a mudança afetar frontend/env de build, verificar que nenhum segredo server-side entra no bundle Vite;
7. antes de merge de mudanças sensíveis, executar busca/scanner de segredos no diff e, quando viável, no histórico Git.

Pendente de melhoria de cobertura identificado pela auditoria:

- o repositório contém `src/planner.zip`; como artefato binário versionado, deve ser incluído em uma futura varredura de segredos do histórico/object database com ferramenta apropriada, sem presumir que exista segredo ali;
- essa pendência é de cobertura, não um vazamento confirmado.

**Bloqueante:** segredo real ou credencial privilegiada detectada em código, Git, docs, CI ou bundle.

### S6 — Inputs e XSS

Para toda mudança que renderize input do usuário em HTML, e-mail, template, markdown, href/src ou conteúdo imprimível:

1. React deve continuar usando rendering padrão escapado sempre que possível;
2. `dangerouslySetInnerHTML`, `innerHTML`, HTML/markdown bruto, `eval` e `new Function` exigem revisão específica e justificativa;
3. HTML de e-mail/PDF/template deve escapar qualquer campo controlável por usuário;
4. URLs controláveis devem rejeitar esquemas perigosos como `javascript:`;
5. se sanitização for necessária, usar biblioteca dedicada e testada — não regex improvisada como substituto geral;
6. criar teste com payloads contendo `<script>`, atributos/event handlers, aspas e entidades.

No baseline auditado, os geradores HTML atuais possuem escape explícito; novas mudanças não podem remover essa propriedade sem gate específico.

**Bloqueante:** input controlável alcançando sink HTML/JS executável sem escape/sanitização adequada.

## 4. Gates técnicos antes do PR

Toda unidade deve executar, conforme aplicável:

- `npm test`;
- testes focados da frente;
- `npm run lint`;
- `npm run build`;
- `git diff --check`;
- revisão de segredos no diff;
- revisão de handlers alterados por ID/autorização/input;
- revisão de migration/RLS/grants quando houver banco.

Mudanças de segurança devem ter teste negativo que falhe antes da correção e passe depois sempre que tecnicamente possível.

## 5. Gate de PR

Antes de pedir merge:

1. CI verde no SHA exato do head;
2. Vercel/preview verde quando aplicável;
3. diff revisado sem arquivos inesperados;
4. nenhuma mudança de Production/banco fora do escopo declarado;
5. nenhum segredo no diff;
6. achados de segurança da unidade classificados como resolvido, aceito explicitamente ou N/A;
7. documentação reconciliada quando a mudança alterar arquitetura, segurança, DR ou comportamento congelado;
8. merge somente após autorização explícita.

## 6. Gate pós-merge

Após merge autorizado:

1. reconciliar local com `git switch main` + `git pull --ff-only`;
2. confirmar novo `HEAD`, `origin/main` e working tree limpa;
3. confirmar deployment final quando aplicável;
4. executar smoke seguro da superfície alterada;
5. para mudanças de banco, confirmar integridade e executar backup pós-mudança quando exigido;
6. registrar novo checkpoint/snapshot seguro quando a frente justificar.

## 7. Prioridades derivadas da auditoria de 03/09/2026

### P1 — Corrigir revogação/downgrade de sessão Admin

**Estado: CORREÇÃO IMPLEMENTADA / AGUARDANDO MERGE E RECONCILIAÇÃO FINAL.**

A prova RED confirmou os três comportamentos inseguros esperados: sessão inativa continuava autenticada, downgrade continuava com role antiga e o runtime não possuía lookup atual por `userId`. A implementação posterior deixou esses testes GREEN e preservou as regressões existentes de login, logout, rotação, revogação e expiração.

### P2 — Automatizar security regression gates

Adicionar gradualmente à CI testes de:

- autorização server-side em endpoints Admin;
- posse/IDOR para PlanningSession;
- invariantes de RLS/grants em migrations quando possível;
- sinks XSS conhecidos;
- ausência de segredos no diff/build.

### P3 — Ampliar varredura de segredos

Executar varredura dedicada do histórico Git/object database e do artefato binário `src/planner.zip`, além de verificar o bundle Vite gerado. Não tratar essa pendência como vazamento até existir evidência real.

## 8. Regra de segurança para velocidade

Segurança deve ser forte sem transformar cada mudança pequena em uma auditoria integral. A regra é:

- mudança pequena → gates proporcionais ao impacto;
- mudança em auth, banco, autorização, ID, input ou segredo → gate específico obrigatório;
- mudança de alto risco → branch isolada + testes negativos + evidência + revisão antes do merge;
- achado crítico/alto confirmado → não empurrar para backlog silenciosamente; classificar, priorizar e fechar com prova.
