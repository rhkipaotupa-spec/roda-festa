# Roda Festa — Resiliência, Backups e Disaster Recovery

Status: **CONCLUÍDO e reconciliado em 03/09/2026**.

## Objetivo

O Roda Festa não deve depender de um único caminho de recuperação. A operação combina histórico de código/deploy, backups gerenciados do Supabase, backup lógico independente, restore real isolado e uma segunda cópia semanal criptografada fora da máquina local.

Princípio: **backup só é considerado comprovado quando sua integridade é validada e um restore isolado real foi executado com sucesso.** Para a camada offsite, a cadeia inclui também autenticação criptográfica, download de volta e comparação com os bytes originais.

## Baseline reconciliado

Baseline seguro de retomada após o fechamento do DR em 02/09/2026:

`3ba6b42696993916a1cb28991f32e9049e7fe66b`

Esse commit é o merge do PR #5 `RF-DR-WEEKLY-OFFSITE-V1`.

## Camadas de proteção

### 1. Código e deploy

- GitHub preserva histórico de código e checkpoints;
- Vercel permite rollback/promote de deployments;
- `main` é linha canônica de Production e não deve ser usada para experimentação;
- mudanças relevantes passam por branch isolada, gates e PR;
- merge exige aprovação explícita.

### 2. Banco gerenciado

Auditoria visual de 01/09/2026 confirmou:

- backups físicos agendados disponíveis;
- Restore disponível;
- Restore to new project disponível;
- Point-in-Time Recovery (PITR) não habilitado no estágio atual;
- Supabase Storage sem buckets/objetos no momento da auditoria.

Para incidente de dados grande ou incerto, preferir restaurar primeiro em ambiente isolado quando possível, validar e só então decidir ação sobre Production.

### 3. Backup lógico independente

Scripts:

- `scripts/db/create-production-backup.mjs`;
- `scripts/db/verify-restore.mjs`;
- `scripts/lib/postgres-connection.mjs`.

O backup:

- usa `pg_dump` em formato custom;
- inclui schema `public`;
- não exporta ownership/privileges;
- é salvo fora do repositório;
- recebe timestamp e commit Git no nome;
- recebe manifesto JSON com tamanho, SHA-256, commit e contagens da origem;
- não imprime URL, senha ou segredo de conexão.

Destino padrão Windows:

`D:\Backups\Roda-Festa\daily`

Override opcional:

`RODA_FESTA_BACKUP_DIR`

O script recusa diretórios dentro do repositório.

### 4. Restore real isolado

O restore de prova:

- exige confirmação destrutiva explícita;
- aceita apenas `localhost`, `127.0.0.1` ou `::1`;
- exige o banco descartável exato `roda_festa_restore_test`;
- recusa origem e alvo incompatíveis com a política;
- valida SHA-256 e tamanho antes do restore;
- executa `pg_restore --list` antes de recriar o alvo;
- usa `pg_restore --clean --if-exists` no banco descartável;
- compara contagens restauradas com o manifesto;
- remove o banco descartável depois de GREEN, salvo inspeção explícita.

### 5. Segunda cópia semanal criptografada

Scripts:

- `scripts/db/create-weekly-encrypted-copy.mjs`;
- `scripts/db/verify-weekly-encrypted-copy.mjs`;
- `scripts/lib/backup-encryption.mjs`.

Staging semanal padrão:

`D:\Backups\Roda-Festa\weekly`

Formato:

`rf-weekly-aes-256-gcm-v1`

Criptografia:

- AES-256-GCM;
- chave de 32 bytes;
- IV aleatório de 12 bytes por arquivo;
- tag GCM de 16 bytes;
- SHA-256 do backup original usado como AAD;
- dump e manifesto cifrados separadamente;
- envelope operacional sem segredo;
- falha de autenticação não produz arquivo recuperável final.

### 6. Cópia off-machine

Destino V1:

- Google Drive;
- pasta operacional `Meu Drive / roda-festa / backups-semanais`;
- somente artefatos cifrados e envelope sem segredo;
- nenhum dump bruto, manifesto bruto ou `.env.backup.local` é enviado.

A prova inclui upload, presença da geração offsite, download de volta para `C:\Temp\rf-offsite-verify`, autenticação GCM, decifragem e igualdade com os bytes originais.

## Evidência histórica de backup e restore — 01/09/2026

Primeira prova completa:

- backup `roda-festa-production-2026-09-01T18-50-52Z-ec75129.dump`;
- tamanho `61165` bytes;
- SHA-256 `1a463fe3f37ad710d94cba19544de1837b7609b80e5ff1734ebd966cb3592210`;
- restore real no `roda_festa_restore_test`;
- contagens origem/restaurado iguais;
- banco descartável removido.

Essas contagens são evidência histórica, não valores hardcoded.

## Evidência histórica direta em D: — 02/09/2026

Backup criado diretamente no destino dedicado:

`D:\Backups\Roda-Festa\daily\roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump`

Evidência:

- `RODA_FESTA_DB_BACKUP_OK`;
- tamanho: `61165` bytes;
- SHA-256: `fdf0f0722c9dfff652b7aafd52592442b279f9d41640d5097d58a9328e0bb42f`;
- tabelas públicas: `6`;
- `planning_sessions`: `21`;
- `product_catalog_overrides`: `3`;
- `product_catalog_history`: `3`.

Restore:

- `RESTORE_ARCHIVE_READABLE_OK`;
- `RODA_FESTA_DB_RESTORE_VERIFY_OK`;
- `RESTORED_PUBLIC_TABLES=6`;
- `RESTORED_PLANNING_SESSIONS=21`;
- `RESTORED_CATALOG_OVERRIDES=3`;
- `RESTORED_CATALOG_HISTORY=3`;
- `BACKUP_AND_RESTORE_RECOVERY_PROOF_OK`;
- `RESTORE_TEST_DATABASE_REMOVED`.

## Evidência histórica da geração semanal — 02/09/2026

Origem:

`D:\Backups\Roda-Festa\daily\roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump`

Resultados:

- SHA-256 original: `fdf0f0722c9dfff652b7aafd52592442b279f9d41640d5097d58a9328e0bb42f`;
- SHA-256 dump cifrado: `4f2d8684d53fa03ebdcb356f264986baaac95b98dffdc8038179be616f7affd1`;
- SHA-256 manifesto cifrado: `b312da00ad3095d91037a172b4f8de1a8aad215da1e13cf156d4029f0dacc68d`;
- `RODA_FESTA_WEEKLY_ENCRYPTED_COPY_OK`;
- `RODA_FESTA_WEEKLY_ENCRYPTED_VERIFY_OK`;
- `WEEKLY_DECRYPTION_AUTHENTICATION_OK`;
- `WEEKLY_VERIFY_TEMP_REMOVED`.

## Evidência histórica do ciclo offsite — 02/09/2026

Cadeia comprovada:

**backup diário validado → AES-256-GCM → staging semanal no D: → upload ao Google Drive → download da nuvem → validação de hash/tamanho → autenticação GCM → decifragem → bytes originais idênticos → limpeza temporária.**

A verificação foi executada contra os arquivos baixados da nuvem, não contra a cópia original em `D:`.

## Configuração local — NÃO COMMITAR CREDENCIAIS

O projeto ignora `.env` e `.env.*`. O arquivo operacional local é `.env.backup.local`.

**Nunca enviar senha, connection string, token, service role/secret key, chave de criptografia ou conteúdo desse arquivo por chat, documento, commit ou screenshot.**

Variáveis usadas pelos scripts devem permanecer locais e secretas. A documentação registra somente nomes de variáveis, gates e formatos, nunca valores.

## Comandos

Backup diário:

```cmd
npm run backup:production
```

Restore de prova:

```cmd
npm run restore:verify -- "D:\Backups\Roda-Festa\daily\<arquivo>.dump"
```

Criação semanal cifrada:

```cmd
npm run backup:weekly:encrypt -- "D:\Backups\Roda-Festa\daily\<arquivo>.dump"
```

Verificação semanal:

```cmd
npm run backup:weekly:verify -- "D:\Backups\Roda-Festa\weekly\<arquivo>.dump.weekly.json"
```

## Política operacional V1

- RPO: **24 horas**;
- RTO: **4 horas**;
- backup lógico: **diário**;
- backup adicional: antes/depois de migration ou intervenção relevante de dados;
- retenção diária mínima: **14 gerações locais**;
- segunda cópia: **semanal, cifrada, off-machine**;
- meta de retenção semanal: **4 gerações**;
- restore drill: **mensal**;
- PITR: **OFF** no estágio atual;
- retenção destrutiva automatizada: **não implementada**.

## Plano de incidente

### Plano A — operação normal

- Production saudável;
- backups físicos do Supabase disponíveis;
- backup lógico diário;
- cópia semanal cifrada/offsite;
- restore drill mensal;
- checkpoint Git conhecido.

### Plano B — problema de código/deploy

- congelar novas mudanças;
- identificar deployment estável anterior;
- rollback/promote Vercel conforme evidência;
- smoke funcional;
- registrar evidência.

### Plano C — problema de dados

- conter novas mutações quando necessário;
- delimitar janela/escopo;
- preservar evidência;
- escolher backup íntegro;
- restaurar primeiro em ambiente isolado;
- validar schema/dados;
- só então decidir correção, restauração ou mudança de endpoint.

### Plano D — indisponibilidade do provedor

- usar backup independente;
- restaurar em PostgreSQL/Supabase secundário;
- validar schema e dados;
- mudar endpoint somente por procedimento controlado;
- reconciliar retorno ao primário posteriormente.

## Retenção

- manter múltiplas gerações, não apenas o último arquivo;
- manter pelo menos 14 diárias locais;
- manter meta de 4 semanais cifradas;
- não automatizar exclusão destrutiva sem teste específico, política fail-closed e aprovação explícita;
- a existência de segunda cópia comprovada não autoriza limpeza automática por si só.

## Supabase Storage

No último levantamento havia 0 buckets e 0 objetos. Se Storage passar a ser usado, reabrir o escopo de backup porque `pg_dump` não cobre automaticamente os objetos armazenados.

## Gate consolidado

Estado final comprovado:

1. backup lógico independente — GREEN;
2. manifesto + SHA-256 — GREEN;
3. archive readability — GREEN;
4. restore real isolado — GREEN;
5. contagens equivalentes — GREEN;
6. banco descartável removido — GREEN;
7. destino dedicado `D:` — GREEN;
8. RPO/RTO — GREEN;
9. política de restore mensal — GREEN;
10. AES-256-GCM semanal — GREEN;
11. chave com recuperação fora da máquina — GREEN;
12. Google Drive offsite — GREEN;
13. upload/download/verify offsite — GREEN;
14. CI final PR #5 — GREEN, run #73;
15. merge PR #5 — GREEN, `3ba6b42696993916a1cb28991f32e9049e7fe66b`;
16. Vercel pós-merge — SUCCESS.

**A frente de DR está encerrada. Não repetir a construção do DR para retomar contexto; novas evoluções devem responder a necessidade real, incidente, mudança de arquitetura ou revisão periódica.**
