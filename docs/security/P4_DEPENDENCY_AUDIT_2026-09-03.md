# P4 — Auditoria e remediação de dependências npm

Data: 03/09/2026

Estado: **VALIDADO LOCALMENTE; fechamento condicionado ao merge aprovado desta unidade após CI/Vercel verdes no head final.**

Baseline de partida: `5cb1f43bb16e4d21c40604e9a7df9fbfac43fd5a`

Commit técnico validado: `309074ff4da0632323f99cf495dec831fff814dc`

Branch: `security/npm-audit-review-p4`

## 1. Objetivo

Investigar os `4 high severity vulnerabilities` reportados por `npm ci` durante a rodada anterior, separar runtime de tooling e aplicar a menor remediação segura possível, sem `npm audit fix --force`, sem major upgrade e sem alteração de código de produto.

## 2. Evidência antes da correção

Foram executados dois audits somente leitura:

- `npm audit --json`
- `npm audit --omit=dev --json`

Resultado completo antes da correção:

- total: 4
- high: 4
- critical: 0

Chaves reportadas:

- `brace-expansion`
- `nanoid`
- `react-router`
- `react-router-dom`

Resultado Production antes da correção:

- total: 2
- high: 2
- critical: 0

Chaves reportadas:

- `react-router`
- `react-router-dom`

SHA-256 dos relatórios pré-correção:

- audit completo: `5507137dfdfefc245e6734e8f5f1541e0a183c6851f3ef154e6796bda2f411e3`
- audit Production: `bf480b8c6caff0a18a71ee452e79955305506c55d4b39009ccb186fd7ac9e745`

## 3. Cadeias identificadas

`npm ls react-router react-router-dom brace-expansion nanoid` mostrou:

- `react-router-dom@7.18.1` -> `react-router@7.18.1`
- `eslint@10.8.0` -> `minimatch@10.2.6` -> `brace-expansion@5.0.8`
- `vite@8.1.5` -> `postcss@8.5.24` -> `nanoid@3.3.16`

A cadeia `react-router-dom`/`react-router` permanecia no audit com `--omit=dev`, portanto era tratada como dependência de Production. `brace-expansion` e `nanoid` desapareciam nesse recorte e eram dependências transitivas de tooling.

O advisory reportado pelo npm para `react-router` descrevia `RSC Mode CSRF Bypass Allows Action Execution Before 400 Response`. O frontend atual do Roda Festa usa SPA Vite com `BrowserRouter`; não foi demonstrada explorabilidade direta desse modo RSC na arquitetura atual. Ainda assim, como havia correção disponível dentro da mesma linha 7.18.x, a unidade removeu o alerta em vez de aceitar o risco.

## 4. Remediação aplicada

Alterações limitadas a `package.json` e `package-lock.json`:

- `react-router-dom`: `7.18.1` -> `7.18.2`
- `react-router`: `7.18.1` -> `7.18.2`
- `brace-expansion`: `5.0.8` -> `5.0.9`
- `nanoid`: `3.3.16` -> `3.3.18`

`package.json` teve somente a alteração declarada de `react-router-dom` de `^7.18.1` para `^7.18.2`; as demais mudanças são transitivas no lockfile.

Não houve:

- migration;
- mudança de banco;
- mudança de API;
- mudança de regra comercial;
- mudança de motor de recomendação;
- mudança de UI;
- `npm audit fix --force`;
- major upgrade.

## 5. Evidência depois da correção

Após a remediação:

- `npm audit --json`: 0 vulnerabilities
- `npm audit --omit=dev --json`: 0 vulnerabilities
- ambos os comandos retornaram exit code 0

Os dois relatórios pós-correção resultaram no mesmo JSON vazio de findings e no mesmo SHA-256:

`f4e33cb6919c380ee3ca41d2cde7f9d046446a6d9996f78779faaf4cfec8dfe6`

Versões confirmadas no lockfile:

- `react-router-dom=7.18.2`
- `react-router=7.18.2`
- `brace-expansion=5.0.9`
- `nanoid=3.3.18`

## 6. Gates locais no conteúdo técnico commitado

Antes do commit técnico, foram executados:

- `npm run test:security`: 110/110, `Security regression gates: GREEN`
- `npm test`: 417/417, 0 falhas
- `npm run lint`: concluído sem erro
- `npm run build`: concluído com sucesso
- `git diff --check`: sem saída

O build preservou o aviso já conhecido de `src/styles/colors.css` vazio; isso não bloqueou o build e não foi tratado como finding de segurança desta unidade.

## 7. Escopo do diff técnico

Comparação do commit-base `5cb1f43bb16e4d21c40604e9a7df9fbfac43fd5a` com o commit técnico `309074ff4da0632323f99cf495dec831fff814dc`:

- 1 commit técnico
- 2 arquivos alterados
- `package.json`: 1 adição / 1 remoção
- `package-lock.json`: 14 adições / 14 remoções

## 8. Gate de fechamento

Esta evidência não autoriza merge por si só.

O fechamento de P4 exige, no head final da PR:

1. diff sem arquivos inesperados;
2. CI verde, incluindo security regression gates, suíte completa, lint e build;
3. Vercel/preview verde quando aplicável;
4. documentação presente no mesmo head final;
5. autorização explícita para merge;
6. pós-merge com `main` local reconciliada, working tree limpa e deployment final confirmado.

Até o merge aprovado, o baseline seguro oficial permanece `5cb1f43bb16e4d21c40604e9a7df9fbfac43fd5a`.
