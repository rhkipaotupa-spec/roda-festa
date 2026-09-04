# P5 — GitHub Actions Node 24 e governança da `main`

Data de fechamento técnico: 03/09/2026

Estado: **FECHADO**

Baseline técnico anterior: `ad6eb282dc83da65c209b96e9fbc0637f35bbb90`

PR: `#12 - ci: migrate GitHub Actions to Node 24 runtime`

Head final da PR: `b11615cb57e30c3f7d99f46fa692178b109e0a6b`

Merge: `5292da7268b134f0a4b822e48c13623073f2da99`

## 1. Escopo

A unidade P5 atualizou somente o runtime das GitHub Actions do workflow existente:

- `actions/checkout@v4 -> @v7`;
- `actions/setup-node@v4 -> @v7`.

Não houve mudança em produto, API, banco, migration, motor de recomendação, regra comercial ou UI.

## 2. Workflow validado

Arquivo:

`.github/workflows/admin-commercial-v1.yml`

Contrato preservado:

- pull requests para `main` disparam validação;
- job obrigatório: `validate`;
- runner: `ubuntu-latest`;
- timeout: 15 minutos;
- `actions/checkout@v7`;
- `actions/setup-node@v7` com Node 24 e cache npm;
- `npm ci`;
- focused Admin Commercial tests;
- `npm run test:security`;
- `npm test`;
- `npm run lint`;
- `npm run build`.

O nome `validate` é parte da fronteira de governança porque é o status check exigido pela ruleset. Não renomear sem atualizar deliberadamente a proteção da `main`.

## 3. Evidência CI P5

Workflow run #99:

- run id `33790474995`;
- job `validate` id `100765591017`;
- conclusão: `SUCCESS`;
- runner Ubuntu 24.04;
- Node `v24.19.0`;
- npm `11.17.0`;
- `npm ci`: 143 packages, 144 audited, 0 vulnerabilities;
- focused Admin tests: 20/20;
- security: 110/110;
- full suite: 417/417;
- lint: PASS;
- build: PASS.

Revisões efetivamente baixadas pelo runner:

- `actions/checkout@v7` = `3d3c42e5aac5ba805825da76410c181273ba90b1`;
- `actions/setup-node@v7` = `820762786026740c76f36085b0efc47a31fe5020`.

O warning antigo de Actions executando em Node 20 deprecated não apareceu na execução P5. O warning conhecido de `src/styles/colors.css` vazio permaneceu não bloqueante.

Vercel Preview da PR #12: `SUCCESS`.

Vercel Production após merge `5292da7268b134f0a4b822e48c13623073f2da99`: `SUCCESS`.

## 4. Ruleset `Protect main`

Ruleset id: `22214695`

Target: `~DEFAULT_BRANCH` / `main`

Enforcement: `active`

Bypass actors: `[]`

`current_user_can_bypass = never`

Regras efetivas:

1. deletion bloqueado;
2. non-fast-forward / force push bloqueado;
3. Pull Request obrigatório;
4. required approving review count = 0;
5. status check obrigatório = `validate`;
6. integration id do status check = `15368`;
7. strict required status checks policy = `false`;
8. allowed merge methods = merge, squash, rebase.

A branch API pode mostrar `protected=true` enquanto o objeto legacy de branch protection permanece `protection.enabled=false`; a proteção efetiva vem do repository ruleset.

Não foi realizado teste destrutivo de push direto/force push. A PR #12 foi a primeira unidade concluída sob a nova ruleset e só chegou ao merge após `validate` GREEN.

## 5. Classificação final

`P5 = CLOSED / ACTIONS NODE24`

`PROTECT MAIN = ACTIVE`

`BYPASS = NONE`

`PULL REQUEST = REQUIRED`

`VALIDATE = REQUIRED`

`DELETE = BLOCKED`

`FORCE PUSH = BLOCKED`

`SAFE BASELINE = 5292da7268b134f0a4b822e48c13623073f2da99`
