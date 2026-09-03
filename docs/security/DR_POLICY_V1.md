# Roda Festa — DR Operational Policy V1

Status: **CONCLUÍDA em 02/09/2026 e reconciliada em 03/09/2026**. Política técnica aprovada, destino local dedicado comprovado, restore real comprovado, segunda cópia semanal criptografada/offsite comprovada e linha final integrada em `main`.

## Objetivo

Transformar a prova técnica de backup/restore em rotina operacional simples, mensurável e proporcional ao estágio atual do Roda Festa.

Esta política complementa `docs/security/RESILIENCE_DR.md` e `docs/security/DR_WEEKLY_OFFSITE_V1.md`.

## Baseline da política

Baseline de Production no início desta frente:

`47747e618d7b67d923f2065616fc90c662aa7d3d`

Fechamento da RF-DR-POLICY-V1:

- PR #3 mergeado em `main`;
- merge commit `bbfa75a004d3614f160e2af9d3367ad0743e1a67`;
- CI final GREEN;
- backup lógico direto em `D:` comprovado;
- restore real isolado comprovado.

Fechamento posterior da segunda cópia:

- PR #5 `RF-DR-WEEKLY-OFFSITE-V1` mergeado;
- head aprovado `87dfd12fc39d86a0247ef01288427a5787c49b4b`;
- CI run #73 GREEN;
- merge commit `3ba6b42696993916a1cb28991f32e9049e7fe66b`;
- Vercel SUCCESS.

## RPO

**RPO V1 = 24 horas.**

Interpretação: em um desastre de dados extremo, a meta mínima é possuir um backup lógico independente com no máximo 24 horas de defasagem.

Exceção obrigatória: qualquer migration, alteração estrutural relevante de banco ou intervenção de dados de maior risco exige backup adicional antes e depois da mudança.

Gatilho de evolução:

- quando perder até 24 horas deixar de ser aceitável, reduzir RPO operacional;
- quando perder algumas horas também se tornar inaceitável, reavaliar PITR do Supabase.

## RTO

**RTO V1 = 4 horas.**

Interpretação: em incidente grave, o objetivo operacional é diagnosticar, restaurar, validar e voltar a operar em até 4 horas.

Esse RTO é meta operacional, não promessa automática. Incidentes de provedor, rede ou corrupção ampla podem exigir escalonamento.

## Backup lógico independente

Periodicidade padrão:

- 1 backup por dia;
- backup extra antes de migration ou intervenção relevante;
- backup extra depois de migration ou intervenção relevante, quando a nova versão estiver validada.

O backup usa:

- `pg_dump` custom;
- manifesto JSON;
- SHA-256;
- contagens de origem;
- formato sem owner/privileges;
- schema `public`.

## Destino local padrão

No Windows:

`D:\Backups\Roda-Festa\daily`

Estrutura aprovada:

```text
D:\Backups\Roda-Festa\
  daily\
  weekly\
  snapshots\
  recovery-evidence\
```

Override do backup diário:

`RODA_FESTA_BACKUP_DIR`

O script recusa diretório dentro do repositório.

## Evidência real do destino D: — 02/09/2026

Backup criado diretamente no destino dedicado:

- `RODA_FESTA_DB_BACKUP_OK`;
- arquivo: `D:\Backups\Roda-Festa\daily\roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump`;
- manifesto no mesmo caminho com sufixo `.json`;
- tamanho: `61165` bytes;
- SHA-256: `fdf0f0722c9dfff652b7aafd52592442b279f9d41640d5097d58a9328e0bb42f`;
- tabelas públicas: `6`;
- `planning_sessions`: `21`;
- `product_catalog_overrides`: `3`;
- `product_catalog_history`: `3`.

As contagens acima são evidência histórica daquela geração, não constantes do sistema.

O mesmo arquivo foi restaurado no banco local descartável `roda_festa_restore_test`.

Resultado:

- `RESTORE_ARCHIVE_READABLE_OK`;
- `RODA_FESTA_DB_RESTORE_VERIFY_OK`;
- `RESTORED_PUBLIC_TABLES=6`;
- `RESTORED_PLANNING_SESSIONS=21`;
- `RESTORED_CATALOG_OVERRIDES=3`;
- `RESTORED_CATALOG_HISTORY=3`;
- `BACKUP_AND_RESTORE_RECOVERY_PROOF_OK`;
- `RESTORE_TEST_DATABASE_REMOVED`.

## Retenção local

Política V1:

- manter pelo menos 14 gerações diárias locais;
- preservar múltiplas gerações válidas;
- não automatizar exclusão destrutiva sem unidade própria;
- qualquer automação futura de retenção deve ser fail-closed e testada antes de excluir arquivo real.

A segunda cópia já foi comprovada, mas isso **não autoriza automaticamente** exclusão de backups antigos.

## Segunda cópia independente — CONCLUÍDA

Objetivo V1 entregue:

- 1 cópia semanal;
- meta de 4 gerações semanais;
- armazenamento fora do computador que contém a cópia local;
- independência do Supabase como único segundo destino;
- criptografia antes do envio para nuvem.

Implementação comprovada:

- criptografia autenticada AES-256-GCM;
- staging local em `D:\Backups\Roda-Festa\weekly`;
- Google Drive como destino off-machine;
- apenas `.rfenc` + envelope operacional sem segredo enviados;
- download de volta da nuvem;
- verificação de hash/tamanho dos cifrados;
- autenticação GCM;
- decifragem;
- igualdade com os bytes do backup original;
- limpeza temporária.

Detalhes e evidências completas ficam em `docs/security/DR_WEEKLY_OFFSITE_V1.md`.

Nenhum dump bruto deve ser enviado para GitHub, chat, armazenamento público ou serviço sem proteção adequada.

## Restore drill

**Frequência V1 = mensal.**

O drill deve:

1. escolher backup + manifesto;
2. validar tamanho e SHA-256;
3. executar `pg_restore --list`;
4. restaurar somente em `roda_festa_restore_test` local;
5. comparar contagens com o manifesto;
6. exigir `BACKUP_AND_RESTORE_RECOVERY_PROOF_OK`;
7. remover o banco descartável ao final;
8. registrar evidência da execução.

Periodicamente, uma geração semanal decifrada deve alimentar o mesmo fluxo para provar a cadeia completa offsite → restore.

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
- alterações de DR passam por branch/PR isolada;
- merge exige aprovação explícita.

## Credenciais

Nunca registrar em Git/docs/chat:

- Database Password;
- senha local PostgreSQL;
- service role/secret key;
- private API key;
- connection string com segredo;
- chave de criptografia dos backups;
- conteúdo de `.env.backup.local`.

`.env.backup.local` permanece local e ignorado pelo Git.

## Revisão da política

Revisar a cada 3 meses ou antes se ocorrer:

- crescimento forte no volume de orçamentos;
- uso operacional diário crítico;
- aumento relevante de usuários;
- introdução de pagamentos/produção/logística;
- uso de Supabase Storage;
- incidente real de dados;
- RPO 24h deixar de ser aceitável;
- RTO 4h deixar de ser aceitável.

## Gate consolidado

Estado em 03/09/2026:

1. política documentada — GREEN;
2. destino local `D:` — GREEN;
3. backup real direto em `D:` — GREEN;
4. manifesto/SHA-256 — GREEN;
5. restore real isolado — GREEN;
6. RPO/RTO formalizados — GREEN;
7. rotina mensal de restore definida — GREEN;
8. segunda cópia semanal AES-256-GCM — GREEN;
9. chave com recuperação fora da máquina — GREEN;
10. Google Drive offsite — GREEN;
11. upload apenas cifrado — GREEN;
12. download + verificação da cópia offsite — GREEN;
13. PR #5 / CI #73 / merge `3ba6b426...` — GREEN;
14. retenção destrutiva automatizada — **NÃO IMPLEMENTADA / NÃO BLOQUEANTE / NÃO AUTORIZADA implicitamente**;
15. PITR — **OFF por decisão do estágio atual**.

**DR Operational Policy V1 permanece encerrada. Próximas evoluções de DR devem responder a necessidade operacional real, não repetir provas já concluídas.**
