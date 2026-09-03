# P3 — SECRET SCAN EVIDENCE — 03/09/2026

Status: **FECHADO na cobertura executada**

Baseline funcional auditado: `d7d89d22ace30d4b2e82847b4abfa44576b552ab`

Objetivo: ampliar a cobertura da auditoria de segredos para as superfícies que ainda não estavam provadas no fechamento anterior: histórico Git/object database, `src/planner.zip` e bundle Vite de produção.

## 1. Ferramenta

Scanner: Gitleaks `8.30.1`.

Artefato Windows x64 usado: `gitleaks_8.30.1_windows_x64.zip`.

SHA-256 validado do artefato: `d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e`.

As execuções com potencial de encontrar material sensível usaram `--redact=100`. Nenhum segredo bruto foi registrado nesta evidência.

## 2. Histórico Git alcançável

Comando lógico executado: Gitleaks em modo `git` sobre o repositório local, com `--log-opts="--all"`.

Resultado:

- exit code: `0`;
- findings: `0`;
- regras acionadas: nenhuma;
- SHA-256 do relatório JSON: `37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570`.

Conclusão: nenhum segredo foi detectado pelo Gitleaks no histórico alcançável percorrido por `git log --all`.

## 3. Object database — blobs unreachable

`git fsck --full --unreachable --no-reflogs` identificou:

- blobs unreachable: `4`;
- commits unreachable: `0`;
- trees unreachable: `0`;
- tags unreachable: `0`.

Os quatro blobs foram lidos diretamente por `git cat-file blob <sha>` e enviados ao Gitleaks via `stdin`, sem persistir seu conteúdo em arquivo de trabalho.

Resultado:

- blobs escaneados: `4`;
- findings: `0`;
- blobs com findings: `0`;
- regras acionadas: nenhuma;
- SHA-256 do resumo sanitizado: `0cc3d194d9d28a9f249811470f73fb6b465e22562a609455484e7a0d5eb3345d`.

Conclusão: nenhum segredo foi detectado pelo Gitleaks nos quatro blobs unreachable existentes no object database local no momento da auditoria.

## 4. `src/planner.zip`

Arquivo auditado:

- SHA-256: `bbf5937d93ce6b555f785fbeb4e998b134b504fdbea2c7121eef5a1dddbf5935`;
- arquivos extraídos: `103`;
- bytes extraídos: `39.597.437`;
- arquivos compactados aninhados: `0`.

Distribuição por extensão:

- `.png`: 20 arquivos / 39.276.616 bytes;
- `.css`: 15 arquivos / 155.051 bytes;
- `.jsx`: 41 arquivos / 98.249 bytes;
- `.js`: 27 arquivos / 67.521 bytes.

O total textual (`.css` + `.jsx` + `.js`) é `320.821` bytes, exatamente o volume reportado pelo Gitleaks como escaneado. Os `39.276.616` bytes restantes correspondem aos 20 PNGs binários.

Resultado do conteúdo textual extraído:

- exit code: `0`;
- findings: `0`;
- regras acionadas: nenhuma;
- SHA-256 do relatório JSON: `37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570`.

Conclusão: nenhum segredo foi detectado pelo Gitleaks no conteúdo textual integral extraído do `planner.zip` identificado acima.

## 5. Bundle Vite

Build executado com sucesso sobre o baseline auditado usando Vite `8.1.5`.

O `git status --short` permaneceu vazio antes e depois do build.

Conteúdo de `dist`:

- arquivos: `42`;
- bytes: `65.999.910`;
- `.png`: 22 arquivos / 47.335.836 bytes;
- `.jpg`: 13 arquivos / 17.917.004 bytes;
- `.js`: 2 arquivos / 499.617 bytes;
- `.css`: 2 arquivos / 232.440 bytes;
- `.svg`: 2 arquivos / 14.553 bytes;
- `.html`: 1 arquivo / 460 bytes.

Resultado Gitleaks:

- exit code: `0`;
- findings: `0`;
- regras acionadas: nenhuma;
- SHA-256 do relatório JSON: `37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570`.

Também foi executada verificação específica, por contagem de marcadores e sem impressão de valores, para impedir que nomes de configuração server-only tivessem atravessado para o bundle:

- `SUPABASE_SERVICE_ROLE_KEY`: `0`;
- `RESEND_API_KEY`: `0`;
- `DATABASE_URL`: `0`;
- `RODA_FESTA_BACKUP_ENCRYPTION_KEY`: `0`;
- total: `0`.

Conclusão: nenhum segredo foi detectado pelo Gitleaks no bundle e nenhum dos marcadores server-only verificados apareceu no output Vite.

## 6. Reconciliação final local

Após a auditoria:

- `git status --short`: vazio;
- `HEAD`: `d7d89d22ace30d4b2e82847b4abfa44576b552ab`;
- `origin/main`: `d7d89d22ace30d4b2e82847b4abfa44576b552ab`.

Nenhuma migration, mutação de Production, alteração de banco ou mudança de comportamento de produto foi realizada nesta unidade.

## 7. Limites da conclusão

Esta evidência permite afirmar: **nenhum segredo foi detectado nas superfícies e com as técnicas acima**.

Ela não deve ser reescrita como garantia absoluta de inexistência de segredo. Em particular:

- Gitleaks é um detector baseado em regras, não prova matemática de ausência;
- PNG/JPG foram tratados como binários e não como texto arbitrário;
- o scan de histórico alcançável usa a visão de patches do Git; blobs unreachable foram cobertos separadamente via `stdin`;
- não foi executado um segundo scanner independente como TruffleHog nesta unidade;
- não foi feita perícia de mídia/esteganografia em imagens.

## 8. Resultado P3

**P3 FECHADO na cobertura definida pela auditoria de 03/09/2026:** histórico Git + object database local, `src/planner.zip` e bundle Vite foram verificados sem findings de segredo.

Qualquer futura evidência concreta de vazamento reabre a frente imediatamente e exige classificação, rotação/revogação quando aplicável e investigação de alcance.
