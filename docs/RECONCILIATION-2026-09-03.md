# Roda Festa — Reconciliação documental 03/09/2026

## Objetivo

Registrar a reconciliação entre o baseline seguro de 02/09/2026, o estado real de `main` e documentos que ainda descreviam etapas anteriores como pendentes.

Este registro **não reescreve fatos históricos**. Entradas antigas continuam representando corretamente o estado observado na data em que foram escritas.

## Baseline confirmado

`main` / `origin/main`:

`3ba6b42696993916a1cb28991f32e9049e7fe66b`

Esse commit corresponde ao merge do PR #5 `RF-DR-WEEKLY-OFFSITE-V1`.

Estado comprovado:

- PR #5 merged/closed;
- head aprovado `87dfd12fc39d86a0247ef01288427a5787c49b4b`;
- CI run #73 GREEN;
- Vercel SUCCESS;
- RF-DR-WEEKLY-OFFSITE-V1 concluída.

## Reconciliação do motor

A promoção histórica de 29/08/2026 de `RF-REC-2.0.0` para Production permanece válida e deve ser preservada como fato histórico.

Após essa promoção, a integração do Brigadeiro no Tacho evoluiu o adaptador autoritativo para:

- `RF-REC-2.1.0`;
- `RF-PARAM-2.0.0-r4-elicited-2026-08-29`;
- `RF-COM-1.0.0`;
- `RF-PRICE-2026-08-24`.

A correção posterior passou a calcular o Brigadeiro no Tacho por convidados reais. Portanto, o estado efetivo atual é `RF-REC-2.1.0`; isso não significa que a documentação histórica de promoção do `2.0.0` estava errada.

Regra atual de convidados equivalentes:

- adultos = `1,0`;
- 7+ = `1,0`;
- 0–6 = `0,35`.

## Reconciliação do DR

A cadeia V1 está concluída:

1. backup físico gerenciado do Supabase;
2. backup lógico independente;
3. manifesto + SHA-256 + contagens;
4. restore real isolado;
5. destino diário dedicado em `D:\Backups\Roda-Festa\daily`;
6. RPO 24h;
7. RTO 4h;
8. restore drill mensal;
9. cópia semanal AES-256-GCM;
10. staging em `D:\Backups\Roda-Festa\weekly`;
11. chave com recuperação fora da máquina;
12. Google Drive como destino off-machine;
13. upload apenas de artefatos cifrados;
14. download da nuvem e verificação contra os arquivos recuperados;
15. merge final no commit `3ba6b42696993916a1cb28991f32e9049e7fe66b`.

Pendências que **não** reabrem o DR:

- retenção destrutiva automatizada continua não implementada;
- PITR permanece desligado;
- Storage deve reabrir escopo se passar a ser usado;
- restore drills continuam rotina periódica, não reconstrução da frente.

## Finding — proveniência de `productionPerHour`

Classificação: **P2 / INVESTIGAR / NÃO BLOQUEANTE**.

O cadastro de produto novo atualmente herda defaults de `productionPerHour` conforme a categoria. Esses valores vêm do catálogo-base/histórico e são tecnicamente válidos para os produtos atuais, mas um produto novo pode herdar um número sem que exista medição operacional específica daquele novo SKU.

Risco conceitual:

- default de categoria parecer medição real;
- futuras decisões de Peak Capacity tratarem um valor herdado como evidência observada.

Decisão nesta reconciliação:

- não alterar comportamento agora;
- não apagar nem zerar capacidades atuais;
- não inventar novos números;
- tratar proveniência/captura de capacidade em unidade técnica própria quando houver necessidade real;
- manter Peak Capacity como futura/não calibrada até existirem dados reais de throughput, equipamento, equipe, horas e competição entre produtos.

## Estado do Admin

Admin Commercial V1 permanece aprovado/congelado até feedback real.

Estado atual:

- Orçamentos;
- Agenda;
- Produtos;
- Ativos / Arquivados / Lixeira;
- edição administrativa de orçamento;
- histórico preservado;
- produtos agrupados por categoria;
- edição individual;
- bulk de preço, lote e capacidade;
- catálogo persistido alimentando o Planning Book.

Não criar módulo `Pedidos` enquanto não existir entidade/lifecycle operacional realmente distinta do orçamento validado.

## Governança

- `main` não é branch de experimento;
- novas mudanças devem sair de baseline limpo em branch isolada;
- preferir lotes autocontidos;
- preservar fatos históricos em vez de reescrever entradas antigas;
- gates aplicáveis antes de PR;
- merge somente após aprovação explícita;
- nenhuma senha, token, cookie, service key, connection string com segredo, chave de backup ou conteúdo de `.env*` entra em docs/Git/chat.

## Arquivos reconciliados nesta unidade

- `docs/security/DR_WEEKLY_OFFSITE_V1.md`;
- `docs/security/DR_POLICY_V1.md`;
- `docs/security/RESILIENCE_DR.md`;
- `docs/CHECKLIST-PROXIMA-SESSAO.md`;
- `docs/MASTER.md`;
- este registro de reconciliação.

`docs/DECISIONS.md` e `docs/FINDINGS.md` são registros cumulativos extensos e devem receber a mesma reconciliação por **append preservando integralmente o histórico**, nunca por substituição parcial/truncada. Enquanto esse append não for realizado com uma operação segura que preserve 100% do conteúdo, este arquivo registra a reconciliação sem apagar histórico anterior.
