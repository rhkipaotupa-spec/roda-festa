# SECURITY UPDATE FLOW — Roda Festa

Estado: **OBRIGATÓRIO para novas atualizações**

Origem: auditoria de segurança concluída em 03/09/2026. Baseline seguro reconciliado: `5292da7268b134f0a4b822e48c13623073f2da99`.

Este documento define os gates mínimos de segurança que fazem parte do fluxo normal de atualização do Roda Festa.

## 1. Princípio

Nenhuma alteração deve chegar a `main` apenas porque testes funcionais passaram. Cada atualização deve preservar explicitamente:

- isolamento de dados;
- autorização server-side;
- proteção contra IDOR;
- ausência de segredos no código/bundle/configuração;
- tratamento seguro de inputs e HTML;
- capacidade de recuperação e rollback já estabelecida pelo DR.

Os gates são proporcionais ao escopo. Quando uma categoria não for afetada, registrar como **N/A com justificativa**.

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

Marcar as superfícies afetadas:

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

## 3. Gates por categoria

### S1 — Banco e isolamento de dados

Para mudança em banco, adapter, query, listagem, busca, relatório, exportação ou agregação:

1. confirmar o mecanismo de isolamento;
2. tabelas server-side atuais usam RLS habilitado, sem policies para `anon`/`authenticated`, com acesso por `service_role` no servidor;
3. novas tabelas públicas devem nascer com RLS e grants mínimos;
4. não criar policy permissiva para `anon`/`authenticated` sem justificativa e teste;
5. PlanningSession pública deve preservar posse pelo token opaco;
6. queries Admin devem permanecer atrás de autenticação/autorização server-side;
7. migration/intervenção em dados exige backup adicional antes e depois conforme DR;
8. revisar Supabase Security Advisor após DDL relevante.

**Bloqueante:** acesso direto indevido, perda de RLS esperada ou query de objeto sem isolamento definido.

### S2 — Autorização server-side

Para nova tela administrativa, botão privilegiado, configuração ou escrita:

1. ocultação de UI não conta como controle;
2. identificar o endpoint da UI;
3. exigir autenticação no backend;
4. exigir role/capability no backend;
5. testar chamada direta sem sessão e sem privilégio;
6. backend deve negar independentemente do frontend.

**Bloqueante:** operação privilegiada protegida apenas no navegador.

### S3 — Sessões administrativas e revogação de privilégios

**P1 FECHADO no merge `32103c70f75da9c6ec1ff2e596735253d22baab0`.**

Toda autenticação de sessão Admin válida por token/revogação/expiração recarrega a identidade atual em `admin_users` pelo `userId` confiável da sessão. Identidade ausente, incompatível ou `active=false` falha fechada; `role` e `capabilities` usados na autorização vêm do registro atual e não do snapshot antigo da sessão.

Preservar regressões para:

- desativação imediata;
- downgrade de role/capability;
- revogação;
- rotação/refresh;
- expiração;
- ausência de token bruto ou material de credencial em respostas/logs.

### S4 — IDOR

Para todo handler novo ou alterado que aceite ID em path, query ou body:

1. identificar objeto e escopo permitido;
2. validar posse/tenant/escopo no servidor antes de ler ou mutar;
3. não confiar em ID vindo da UI;
4. criar teste negativo com ID válido de outro contexto;
5. PlanningSession pública preserva `sessionId + tokenHash`;
6. Admin preserva fronteira administrativa server-side.

**Bloqueante:** objeto acessível apenas por conhecer/adivinhar o ID.

### S5 — Segredos e configuração

Em toda atualização:

1. não hardcodar API key, token, senha, secret, private key, webhook secret, connection string privilegiada ou chave de backup;
2. não usar fallback público que possa virar segredo real;
3. configuração privilegiada ausente deve falhar fechada;
4. `.env`, `.env.*` e arquivos locais sensíveis permanecem fora do Git;
5. revisar scripts, docs, workflow CI e configs de deploy modificadas;
6. se afetar frontend/env de build, confirmar que segredo server-side não entra no bundle;
7. executar busca/scanner proporcional ao risco.

**P3 FECHADO em 03/09/2026 dentro da cobertura executada.** A varredura dedicada cobriu histórico Git alcançável, blobs unreachable do object database local, `src/planner.zip` e bundle Vite, sem findings do Gitleaks v8.30.1. Evidência detalhada: `docs/security/P3_SECRET_SCAN_2026-09-03.md`.

A conclusão é limitada à cobertura executada: nenhum segredo foi detectado nas superfícies verificadas; isso não equivale a garantia absoluta de inexistência de segredo. TruffleHog não foi executado.

### S6 — Inputs e XSS

Para conteúdo controlável por usuário:

1. preferir rendering React padrão escapado;
2. `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` e HTML/markdown bruto exigem revisão específica;
3. HTML de e-mail/PDF/template deve escapar input;
4. URLs controláveis devem rejeitar esquemas perigosos;
5. sanitização, quando necessária, deve usar biblioteca dedicada/testada.

## 4. Security regression gates automatizados — P2

**P2 FECHADO no merge `d7d89d22ace30d4b2e82847b4abfa44576b552ab`.**

O comando estável é:

`npm run test:security`

O comando executa `scripts/security/run-regression-gates.mjs` e concentra cobertura explícita para:

- autenticação/autorização/sessão Admin, incluindo o P1 de identidade atual;
- ownership/IDOR de PlanningSession;
- contratos de persistência com RLS/grants já codificados em testes;
- fronteira moderna de segredo Supabase;
- roteamento de API Vercel;
- ausência de marcadores de segredo server-side em código frontend;
- ausência de sinks frontend perigosos conhecidos (`dangerouslySetInnerHTML`, `.innerHTML`, `eval(` e `new Function(`).

O workflow de PR para `main` executa **Security regression gates** antes da suíte completa. Esse gate não substitui `npm test`, lint, build, revisão de diff, scanner histórico ou revisão humana específica do escopo.

## 5. Gates técnicos antes do PR

Toda unidade deve executar, conforme aplicável:

- `npm run test:security`;
- testes focados da frente;
- `npm test`;
- `npm run lint`;
- `npm run build`;
- `git diff --check`;
- revisão de segredos no diff;
- revisão de handlers alterados por ID/autorização/input;
- revisão de migration/RLS/grants quando houver banco.

Mudanças de segurança devem ter teste negativo RED → GREEN sempre que tecnicamente possível.

## 6. Gate de PR

Antes de pedir merge:

1. CI verde no SHA exato do head;
2. Vercel/preview verde quando aplicável;
3. diff revisado sem arquivos inesperados;
4. nenhuma mudança de Production/banco fora do escopo;
5. nenhum segredo no diff;
6. achados classificados como resolvido, aceito explicitamente ou N/A;
7. documentação reconciliada;
8. merge somente após autorização explícita.

## 7. Gate pós-merge

Após merge autorizado:

1. `git switch main` + `git pull --ff-only`;
2. confirmar `HEAD`, `origin/main` e working tree limpa;
3. confirmar deployment final;
4. executar smoke seguro da superfície alterada;
5. para banco, confirmar integridade e backup pós-mudança quando exigido;
6. registrar novo checkpoint/snapshot quando a frente justificar.

## 8. Prioridades derivadas da auditoria de 03/09/2026

### P1 — Sessão Admin

**FECHADO.** Revalidação de identidade atual por request autenticado está em `main` desde `32103c70f75da9c6ec1ff2e596735253d22baab0`.

### P2 — Automatizar security regression gates

**FECHADO.** Merge `d7d89d22ace30d4b2e82847b4abfa44576b552ab`; comando dedicado, runner central e etapa explícita de CI estão em `main`.

### P3 — Ampliar varredura de segredos

**FECHADO na cobertura executada em 03/09/2026.** Histórico Git/object database local, `src/planner.zip` e bundle Vite foram verificados sem findings do Gitleaks v8.30.1. Ver `docs/security/P3_SECRET_SCAN_2026-09-03.md`.

### P4 — Auditoria de dependências npm

**FECHADO.** PR #11 mergeada em `ad6eb282dc83da65c209b96e9fbc0637f35bbb90`. `react-router-dom/react-router` foram atualizados para 7.18.2, `brace-expansion` para 5.0.9 e `nanoid` para 3.3.18. `npm audit --json` e `npm audit --omit=dev --json` retornaram zero vulnerabilidades; security 110/110, full 417/417, lint/build GREEN; CI/Vercel/Production SUCCESS. Evidência: `docs/security/P4_DEPENDENCY_AUDIT_2026-09-03.md`.

### P5 — GitHub Actions em Node 24

**FECHADO.** PR #12 mergeada em `5292da7268b134f0a4b822e48c13623073f2da99`. Workflow usa `actions/checkout@v7`, `actions/setup-node@v7`, Node 24 e preserva o job `validate`.

### Governança da `main`

Ruleset `Protect main` id `22214695` está ativo para `~DEFAULT_BRANCH/main`, sem bypass (`current_user_can_bypass=never`), bloqueando deletion e non-fast-forward/force push, exigindo Pull Request e status check `validate` da integração GitHub Actions. `required approvals = 0` e `strict required status checks = false` são decisões deliberadas para o repositório operado por uma pessoa.

O nome do job `validate` é parte da fronteira de governança e não deve ser renomeado sem atualizar a ruleset.

## 9. Regra de segurança para velocidade

- mudança pequena → gates proporcionais;
- auth/banco/autorização/ID/input/segredo → gate específico obrigatório;
- alto risco → branch isolada + teste negativo + evidência + revisão;
- achado crítico/alto confirmado → classificar, priorizar e fechar com prova.

## 10. Baseline reconciliado após P5

Baseline seguro corrente após o fechamento de 03/09/2026:

`5292da7268b134f0a4b822e48c13623073f2da99`

A partir deste ponto, toda nova frente deve nascer de `main` limpa nesse commit ou em baseline posterior verificado.
