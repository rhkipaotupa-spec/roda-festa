# Roda Festa — Weekly Encrypted Offsite V1

Status: **CONCLUÍDA em 02/09/2026**. Camada criptográfica local, ciclo offsite Google Drive, revisão de segurança da conta offsite, CI final e merge em `main` foram comprovados. PR #5 foi mergeado no commit `3ba6b42696993916a1cb28991f32e9049e7fe66b`.

## Objetivo

Adicionar uma segunda cópia independente ao DR do Roda Festa, semanal, criptografada antes de sair da máquina local e mantida fora do computador que contém o backup diário.

Esta unidade complementa `docs/security/DR_POLICY_V1.md`.

## Baseline de início

Baseline de `main` no início desta frente:

`d56b568bc83d8d4d86b13b3685b7e0c5d8feb60c`

A RF-DR-POLICY-V1 já estava concluída com:

- backup lógico diário em `D:\Backups\Roda-Festa\daily`;
- manifesto JSON;
- SHA-256 e tamanho;
- contagens da origem;
- restore real isolado comprovado;
- RPO V1 de 24h;
- RTO V1 de 4h;
- restore drill mensal;
- 14 gerações diárias locais como política mínima;
- nenhuma exclusão automática destrutiva.

## Escopo entregue

- artefato semanal criptografado a partir de backup diário previamente validado;
- AES-256-GCM autenticado;
- dump e manifesto criptografados;
- envelope operacional sem segredo;
- validação de hash e tamanho dos artefatos cifrados;
- prova de decifragem e igualdade do SHA-256 do dump original;
- remoção de artefatos temporários da verificação;
- staging semanal dedicado em `D:`;
- segunda cópia off-machine no Google Drive;
- download de volta do destino offsite e verificação contra os arquivos efetivamente recuperados;
- chave de recuperação com cópia segura fora da máquina local.

## Fora de escopo desta unidade

- enviar dumps brutos para nuvem;
- guardar chave em GitHub, Vercel, Supabase, documentação versionada ou chat;
- excluir backups antigos automaticamente;
- automatizar retenção destrutiva;
- habilitar PITR.

## Criptografia

Formato interno:

`rf-weekly-aes-256-gcm-v1`

Algoritmo:

`AES-256-GCM`

Propriedades:

- chave de 32 bytes;
- IV aleatório de 12 bytes por arquivo;
- tag de autenticação GCM de 16 bytes;
- SHA-256 do backup de origem usado como Additional Authenticated Data (AAD);
- dump e manifesto recebem IVs independentes;
- arquivo cifrado é gravado primeiro em caminho temporário e renomeado somente após sucesso;
- falha de autenticação não produz arquivo restaurável final.

## Chave de recuperação

Variável local:

`RODA_FESTA_BACKUP_ENCRYPTION_KEY`

Formato exigido:

- 64 caracteres hexadecimais;
- equivalentes a 32 bytes aleatórios.

Regras obrigatórias:

- nunca enviar a chave por chat;
- nunca commitar a chave;
- nunca colocar a chave no envelope `.weekly.json`;
- nunca imprimir a chave em logs;
- a chave local pode ficar em `.env.backup.local`, ignorado pelo Git;
- manter pelo menos uma cópia de recuperação da chave fora desta máquina;
- perder a chave significa perder a capacidade de restaurar os backups cifrados.

Em 02/09/2026 a chave foi gerada diretamente em `.env.backup.local`, sem impressão em terminal/chat, e validada apenas por formato. Também foi comprovada uma cópia de recuperação fora da máquina local em gerenciador de senhas sincronizado. Nenhum conteúdo secreto foi registrado no repositório.

## Destino semanal local

Padrão Windows:

`D:\Backups\Roda-Festa\weekly`

Override opcional:

`RODA_FESTA_WEEKLY_BACKUP_DIR`

O script recusa destino dentro do repositório. Este diretório é staging/local retention e não satisfaz sozinho o requisito offsite.

## Artefatos de cada geração

Para um backup de origem:

`roda-festa-production-<timestamp>-<commit>.dump`

são gerados:

1. `<arquivo>.dump.rfenc` — dump cifrado;
2. `<arquivo>.dump.json.rfenc` — manifesto cifrado;
3. `<arquivo>.dump.weekly.json` — envelope operacional sem a chave.

O envelope registra formato, algoritmo, arquivo original, SHA-256/tamanho do original, nomes dos cifrados, SHA-256/tamanho dos cifrados e tamanho da tag de autenticação.

## Comandos operacionais

Criação:

```cmd
npm run backup:weekly:encrypt -- "D:\Backups\Roda-Festa\daily\<arquivo>.dump"
```

Gate explícito:

`ALLOW_RODA_FESTA_WEEKLY_ENCRYPTION=CREATE_ENCRYPTED_WEEKLY_COPY`

Verificação:

```cmd
npm run backup:weekly:verify -- "D:\Backups\Roda-Festa\weekly\<arquivo>.dump.weekly.json"
```

Gate explícito:

`ALLOW_RODA_FESTA_WEEKLY_VERIFY=VERIFY_ENCRYPTED_WEEKLY_COPY`

A criação exige dump/manifesto válidos, igualdade de tamanho e SHA-256, chave válida, destino fora do repositório e ausência de colisão. A verificação valida os cifrados, autentica AES-GCM, decifra em diretório temporário, exige igualdade com o backup original e remove temporários ao final.

## Evidência real — geração de 02/09/2026

Backup diário de origem previamente comprovado por restore:

`D:\Backups\Roda-Festa\daily\roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump`

Evidência:

- tamanho original: `61165` bytes;
- SHA-256 original: `fdf0f0722c9dfff652b7aafd52592442b279f9d41640d5097d58a9328e0bb42f`;
- SHA-256 do dump cifrado: `4f2d8684d53fa03ebdcb356f264986baaac95b98dffdc8038179be616f7affd1`;
- SHA-256 do manifesto cifrado: `b312da00ad3095d91037a172b4f8de1a8aad215da1e13cf156d4029f0dacc68d`;
- `RODA_FESTA_WEEKLY_ENCRYPTED_COPY_OK`;
- `RODA_FESTA_WEEKLY_ENCRYPTED_VERIFY_OK`;
- `WEEKLY_DECRYPTION_AUTHENTICATION_OK`;
- `WEEKLY_VERIFY_TEMP_REMOVED`.

A igualdade de SHA-256 e tamanho após decifragem prova que a cópia cifrada voltou exatamente aos bytes do backup original usado como origem.

## Segunda cópia off-machine

Destino V1 escolhido em 02/09/2026:

- provedor: Google Drive;
- pasta operacional: `Meu Drive / roda-festa / backups-semanais`;
- conta sob controle do responsável pelo projeto;
- somente artefatos já criptografados são enviados;
- dump bruto, manifesto bruto e `.env.backup.local` não são enviados.

A revisão de segurança da conta offsite foi concluída em 02/09/2026. Detalhes de autenticação não são versionados.

## Evidência real do ciclo offsite — 02/09/2026

Foi enviada uma geração completa contendo somente:

1. `roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump.rfenc`;
2. `roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump.json.rfenc`;
3. `roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump.weekly.json`.

Os três arquivos foram baixados novamente do Google Drive para diretório temporário isolado:

`C:\Temp\rf-offsite-verify`

A verificação foi executada contra o envelope **baixado da nuvem**, não contra a cópia original em `D:`.

Resultado:

- `RODA_FESTA_WEEKLY_ENCRYPTED_VERIFY_OK`;
- SHA-256 recuperado: `fdf0f0722c9dfff652b7aafd52592442b279f9d41640d5097d58a9328e0bb42f`;
- tamanho recuperado: `61165` bytes;
- `WEEKLY_DECRYPTION_AUTHENTICATION_OK`;
- `WEEKLY_VERIFY_TEMP_REMOVED`.

Ciclo comprovado:

**backup diário validado → criptografia autenticada → staging semanal no D: → upload de artefatos cifrados ao Google Drive → download da nuvem → validação de hash/tamanho → autenticação AES-256-GCM → decifragem → bytes originais idênticos → limpeza temporária.**

## Retenção V1

Meta aprovada:

- produzir 1 geração semanal;
- manter 4 gerações semanais;
- manter por enquanto a geração local em `D:` mesmo depois do upload;
- nenhuma exclusão automática até que a operação recorrente seja observada e a política destrutiva tenha teste específico.

A segunda cópia já está comprovada. Isso **não autoriza automaticamente retenção destrutiva**; exclusão automatizada continua sendo unidade futura e independente.

## Prova adicional de recuperabilidade

A verificação criptográfica não substitui o restore drill PostgreSQL. Periodicamente, uma geração semanal decifrada deve alimentar o mesmo fluxo de `restore:verify`, mantendo a separação:

**integridade criptográfica → decifragem → integridade do dump → restore real isolado**.

## Fechamento da frente

Resultado final de RF-DR-WEEKLY-OFFSITE-V1:

1. implementação criptográfica isolada — GREEN;
2. round-trip criptográfico automatizado — GREEN;
3. chave errada falha fechada — GREEN;
4. scripts não imprimem chave — GREEN;
5. geração semanal real — GREEN em 02/09/2026;
6. verificação real da geração — GREEN;
7. chave com recuperação fora da máquina — GREEN;
8. destino offsite Google Drive — GREEN;
9. upload somente dos artefatos cifrados — GREEN;
10. download de volta — GREEN;
11. verificação da cópia baixada — GREEN;
12. CI final — GREEN, run #73 no head `87dfd12fc39d86a0247ef01288427a5787c49b4b`;
13. revisão de segurança da conta offsite — GREEN;
14. aprovação explícita antes do merge — GREEN;
15. PR #5 mergeado em `main` — GREEN;
16. merge commit — `3ba6b42696993916a1cb28991f32e9049e7fe66b`;
17. Vercel do merge — SUCCESS.

**RF-DR-WEEKLY-OFFSITE-V1 encerrada.**
