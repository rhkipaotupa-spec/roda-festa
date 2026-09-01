# Roda Festa — Resiliência, Backups e Disaster Recovery

Status: implementação em validação na branch `chore/backup-recovery-v1`.

## Objetivo

O Roda Festa não deve depender de um único caminho de recuperação. O banco gerenciado pelo Supabase possui backups físicos agendados, mas a operação também deve manter uma cópia lógica independente e uma prova periódica de restore real.

Princípio: **backup só é considerado comprovado quando um restore isolado foi executado e validado.**

## Camadas de proteção

### 1. Código e deploy

- GitHub preserva histórico de código e checkpoints.
- Vercel permite rollback para deployment anterior ou específico.
- Checkpoint de Production na criação desta frente: `410f76217d2d8192a427ad046d37457ff4b7e8a0`.

### 2. Banco gerenciado

Auditoria visual de 01/09/2026 confirmou:

- backups físicos agendados disponíveis para restauração;
- múltiplos pontos recentes com status válido;
- `Restore to new project (BETA)` disponível;
- Point-in-Time Recovery (PITR) não habilitado no estágio atual;
- Supabase Storage sem buckets/objetos no momento da auditoria.

Para incidente de dados grande ou incerto, preferir restaurar primeiro em projeto isolado quando possível, validar e só então decidir ação sobre Production.

### 3. Backup lógico independente

Scripts desta frente:

- `scripts/db/create-production-backup.mjs`
- `scripts/db/verify-restore.mjs`
- `scripts/lib/postgres-connection.mjs`

O backup:

- usa `pg_dump` em formato custom;
- inclui somente o schema `public`;
- não exporta ownership/privileges;
- é salvo fora do repositório, em `../roda-festa-backups`;
- recebe timestamp e commit Git no nome;
- recebe manifesto JSON com tamanho, SHA-256, commit e contagens de origem;
- nunca imprime URL, senha ou ambiente de conexão.

O restore de prova:

- exige confirmação destrutiva explícita;
- recusa qualquer host que não seja `localhost`, `127.0.0.1` ou `::1`;
- exige o banco descartável exato `roda_festa_restore_test`;
- valida SHA-256 e tamanho antes do restore;
- executa `pg_restore --list` antes de apagar/criar o alvo;
- recria somente o banco local reservado;
- compara automaticamente as contagens restauradas com o manifesto;
- remove o banco descartável depois de GREEN, salvo pedido explícito para inspeção.

## Baseline de prova atual

No momento em que esta frente foi desenhada, a origem possuía:

- 6 tabelas públicas;
- 21 registros em `planning_sessions`;
- 3 registros em `product_catalog_overrides`;
- 3 registros em `product_catalog_history`.

Esses números são evidência histórica, não valores hardcoded. Cada novo backup consulta a origem e grava suas próprias contagens no manifesto.

## Configuração local — NÃO COMMITAR CREDENCIAIS

O projeto ignora `.env` e `.env.*`. Criar localmente um arquivo `.env.backup.local`.

**Nunca enviar senha, connection string, token, service role key ou conteúdo desse arquivo por chat, documento, commit ou screenshot.**

As senhas devem ficar separadas das URLs para evitar problemas com caracteres especiais e reduzir risco de exposição acidental.

Exemplo estrutural, com placeholders:

```text
POSTGRES_BIN=C:\Program Files\PostgreSQL\18\bin
RODA_FESTA_DATABASE_URL=postgresql://<usuario>@<host>:5432/<banco>?sslmode=require
RODA_FESTA_DATABASE_PASSWORD=<senha-do-banco-supabase>
ALLOW_RODA_FESTA_DB_BACKUP=CREATE_READ_ONLY_BACKUP
RODA_FESTA_RESTORE_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/roda_festa_restore_test
RODA_FESTA_RESTORE_PASSWORD=<senha-local-postgresql>
ALLOW_RODA_FESTA_RESTORE_TEST=ERASE_LOCAL_RESTORE_TARGET
```

A senha local do PostgreSQL também é segredo e não deve entrar no Git.

## Comandos

Depois de sincronizar a branch e criar `.env.backup.local`:

```cmd
npm run backup:production
```

O comando imprime `RODA_FESTA_DB_BACKUP_OK` e o caminho do `.dump`/manifesto quando termina corretamente.

Para provar o restore, usar o caminho do dump retornado:

```cmd
npm run restore:verify -- "C:\Projetos\roda-festa-backups\<arquivo>.dump"
```

GREEN completo exige:

- `RESTORE_ARCHIVE_READABLE_OK`
- `RODA_FESTA_DB_RESTORE_VERIFY_OK`
- contagens restauradas iguais às do manifesto
- `BACKUP_AND_RESTORE_RECOVERY_PROOF_OK`
- `RESTORE_TEST_DATABASE_REMOVED`

## Plano de incidente

### Plano A — operação normal

- Production saudável;
- backups físicos do Supabase monitorados;
- backup lógico independente periódico;
- restore real periódico;
- checkpoint Git conhecido.

### Plano B — problema de código/deploy

- congelar novas mudanças;
- identificar deployment estável anterior;
- rollback Vercel;
- smoke funcional;
- registrar evidência.

### Plano C — problema de dados

- impedir novas mutações quando necessário;
- delimitar janela/escopo do incidente;
- preservar evidência;
- preferir restore em projeto/banco isolado para análise;
- validar dados essenciais;
- somente então decidir correção, restauração ou troca de endpoint.

### Plano D — indisponibilidade do provedor

- usar backup independente fora do caminho operacional primário;
- restaurar em PostgreSQL/Supabase secundário;
- validar schema e dados;
- mudar endpoint apenas por procedimento controlado;
- reconciliar retorno ao primário posteriormente.

## Retenção proposta para o estágio atual

Até haver volume operacional que justifique política mais agressiva:

- backups automáticos do Supabase: manter conforme plano contratado;
- backup lógico independente: pelo menos antes/depois de alterações relevantes de banco e em periodicidade operacional definida;
- manter múltiplas gerações, não apenas o último arquivo;
- armazenar uma segunda cópia em local independente do computador e do Supabase;
- revisar PITR quando perder algumas horas de dados se tornar inaceitável.

## RPO/RTO

Ainda devem ser formalizados com base no uso real da Adrielly/equipe:

- RPO: perda máxima aceitável de dados;
- RTO: tempo máximo aceitável de indisponibilidade.

Não inventar metas antes de conhecer o impacto operacional real.

## Gate desta frente

Não mergear em `main` somente porque os scripts existem.

Antes de promoção:

1. testes estáticos GREEN;
2. backup real de Production criado com PostgreSQL 18;
3. manifesto e SHA-256 gerados;
4. archive readability GREEN;
5. restore real em `roda_festa_restore_test` local;
6. contagens origem/restaurado iguais;
7. banco descartável removido;
8. evidência registrada;
9. aprovação explícita antes de merge.
