# Roda Festa — DR Operational Policy V1

Status: política técnica aprovada em 02/09/2026; destino local dedicado, restore real e CI comprovados na branch `chore/dr-policy-v1`; aprovação de merge ainda pendente.

## Objetivo

Transformar a prova técnica de backup/restore concluída em 01/09/2026 em rotina operacional simples, mensurável e proporcional ao estágio atual do Roda Festa.

Esta política complementa `docs/security/RESILIENCE_DR.md`.

## Baseline de segurança

Baseline de Production no início desta frente:

`47747e618d7b67d923f2065616fc90c662aa7d3d`

Estado comprovado antes desta política:

- Admin Commercial V1 em Production;
- PR #1 merged/closed;
- RF-DR-V1 merged/closed;
- backup lógico independente real criado;
- SHA-256 registrado;
- restore real isolado em PostgreSQL 18.6 concluído;
- contagens origem/restaurado iguais (`6 / 21 / 3 / 3`);
- banco descartável removido;
- Vercel final success;
- local e `origin/main` reconciliados;
- working tree limpa.

## RPO

**RPO V1 = 24 horas.**

Interpretação: em um desastre de dados extremo, a meta mínima é possuir um backup lógico independente com no máximo 24 horas de defasagem.

Exceção obrigatória: qualquer migration, alteração estrutural relevante de banco ou intervenção de dados de maior risco exige backup adicional antes e depois da mudança.

Gatilho de evolução:

- quando perder até 24 horas deixar de ser aceitável, reduzir RPO operacional para 4 horas;
- quando perder algumas horas também se tornar inaceitável, reavaliar PITR do Supabase.

## RTO

**RTO V1 = 4 horas.**

Interpretação: em incidente grave, o objetivo operacional é diagnosticar, restaurar, validar e voltar a operar em até 4 horas.

Esse RTO é uma meta operacional, não promessa automática. Incidentes de provedor, rede ou corrupção ampla podem exigir escalonamento.

## Backup lógico independente

Periodicidade padrão:

- 1 backup por dia;
- backup extra antes de migration ou intervenção relevante;
- backup extra depois de migration ou intervenção relevante, quando a nova versão estiver validada.

O backup continua usando:

- `pg_dump` custom;
- manifesto JSON;
- SHA-256;
- contagens de origem;
- formato sem owner/privileges;
- schema `public`.

## Destino local padrão

Por decisão operacional de 02/09/2026, o destino local padrão no Windows é:

`D:\Backups\Roda-Festa\daily`

Estrutura aprovada:

```text
D:\Backups\Roda-Festa\
  daily\
  weekly\
  snapshots\
  recovery-evidence\
```

O script aceita override explícito por `RODA_FESTA_BACKUP_DIR`, porém recusa diretório dentro do repositório. No Windows, sem override, usa `D:\Backups\Roda-Festa\daily`.

A cópia de recuperação comprovada de 01/09/2026 foi preservada no local original em `C:\Projetos\roda-festa-backups` e também copiada para `D:`. A cópia no `D:` foi validada sem mover/apagar a origem:

- arquivo: `roda-festa-production-2026-09-01T18-50-52Z-ec75129.dump`;
- tamanho: `61165` bytes;
- SHA-256: `1a463fe3f37ad710d94cba19544de1837b7609b80e5ff1734ebd966cb3592210`;
- hash e tamanho idênticos ao backup original.

A cópia antiga em `C:` não deve ser removida automaticamente. Qualquer limpeza futura exige decisão explícita depois de a segunda cópia criptografada estar comprovada.

## Evidência real do destino D: — 02/09/2026

Na branch `chore/dr-policy-v1`, após teste estático GREEN (`6/6`), foi criado um novo backup real diretamente no destino dedicado:

- resultado: `RODA_FESTA_DB_BACKUP_OK`;
- arquivo: `D:\Backups\Roda-Festa\daily\roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump`;
- manifesto: mesmo caminho com sufixo `.json`;
- tamanho: `61165` bytes;
- SHA-256: `fdf0f0722c9dfff652b7aafd52592442b279f9d41640d5097d58a9328e0bb42f`;
- commit registrado no nome: `b3732a0`;
- tabelas públicas na origem: `6`;
- `planning_sessions`: `21`;
- `product_catalog_overrides`: `3`;
- `product_catalog_history`: `3`.

O mesmo arquivo criado diretamente no `D:` foi submetido ao restore de prova real no banco local descartável `roda_festa_restore_test`.

Resultado:

- `RESTORE_ARCHIVE_READABLE_OK`;
- `RODA_FESTA_DB_RESTORE_VERIFY_OK`;
- `RESTORED_PUBLIC_TABLES=6`;
- `RESTORED_PLANNING_SESSIONS=21`;
- `RESTORED_CATALOG_OVERRIDES=3`;
- `RESTORED_CATALOG_HISTORY=3`;
- `BACKUP_AND_RESTORE_RECOVERY_PROOF_OK`;
- `RESTORE_TEST_DATABASE_REMOVED`.

Durante o fluxo, `dropdb --if-exists` informou que `roda_festa_restore_test` ainda não existia antes da recriação. Essa mensagem é esperada e não representa falha.

Resultado da unidade: **Production → backup direto no D: → manifesto/SHA-256 → restore real local → contagens idênticas → banco descartável removido** foi comprovado.

## Retenção local

Política V1:

- manter pelo menos 14 gerações diárias locais;
- não automatizar exclusão enquanto a segunda cópia criptografada não estiver comprovada;
- limpeza deve preservar sempre múltiplas gerações válidas;
- qualquer automação futura de retenção deve ser fail-closed e testada antes de excluir arquivo real.

## Segunda cópia independente

Objetivo V1:

- 1 cópia semanal;
- manter 4 gerações semanais;
- armazenar fora do computador que contém a cópia local;
- não depender do Supabase como único segundo destino;
- criptografar antes de enviar para nuvem.

A escolha concreta do provedor de nuvem e o mecanismo de criptografia ainda precisam ser implementados e comprovados.

Nenhum dump bruto deve ser enviado para GitHub, chat, armazenamento público ou serviço sem proteção adequada.

## Restore drill

**Frequência V1 = mensal.**

O drill deve repetir o padrão comprovado em 01/09/2026 e novamente em 02/09/2026:

1. escolher backup + manifesto;
2. validar tamanho e SHA-256;
3. executar `pg_restore --list`;
4. restaurar somente em `roda_festa_restore_test` local;
5. comparar contagens com o manifesto;
6. exigir `BACKUP_AND_RESTORE_RECOVERY_PROOF_OK`;
7. remover o banco descartável ao final;
8. registrar evidência da execução.

Backup sem restore real periódico não é considerado evidência suficiente de recuperabilidade contínua.

## Supabase

Continuar usando em paralelo:

- backups físicos agendados;
- Restore;
- Restore to new project quando apropriado.

PITR:

- permanece desligado;
- não contratar/habilitar sem decisão explícita;
- reavaliar quando o RPO de horas se tornar requisito real.

Supabase Storage:

- no último levantamento havia 0 buckets e 0 objects;
- reavaliar a política quando Storage passar a ser usado, porque objetos não estão cobertos pelo dump PostgreSQL.

## Código e deploy

Camadas preservadas:

- GitHub para histórico e checkpoints;
- Vercel para rollback/promote;
- `main` não é branch de experimento;
- alterações de DR devem passar por branch/PR isolada.

## Credenciais

Nunca registrar em Git/docs/chat:

- Database Password;
- senha local PostgreSQL;
- service role key;
- private API key;
- connection string com segredo;
- conteúdo de `.env.backup.local`.

`.env.backup.local` permanece local e ignorado pelo Git.

## Revisão da política

Revisar a cada 3 meses ou antes se ocorrer qualquer um destes gatilhos:

- crescimento forte no volume de orçamentos;
- uso operacional diário crítico;
- aumento relevante de usuários;
- introdução de pagamentos/produção/logística;
- uso de Supabase Storage;
- incidente real de dados;
- RPO 24h deixar de ser aceitável;
- RTO 4h deixar de ser aceitável.

## Gate desta frente

Antes de promover `RF-DR-POLICY-V1` para `main`:

1. política documentada — GREEN;
2. destino local `D:` implementado de forma controlada — GREEN;
3. backup comprovado copiado para `D:` sem apagar origem — GREEN;
4. tamanho da cópia igual ao original — GREEN;
5. SHA-256 da cópia igual ao original — GREEN;
6. novo backup real criado diretamente no destino `D:` — GREEN;
7. restore real do novo backup GREEN — GREEN;
8. CI completo GREEN — GREEN (run #66, head `7786bbfffc3341303ecb831369fbd201d3733342`);
9. evidência registrada — GREEN;
10. aprovação explícita antes do merge — pendente.

Até o item 10 ser cumprido, **não mergear esta branch em `main`**.
