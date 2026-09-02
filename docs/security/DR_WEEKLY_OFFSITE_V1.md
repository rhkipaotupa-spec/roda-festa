# Roda Festa — Weekly Encrypted Offsite V1

Status: implementação em validação na branch `chore/dr-weekly-offsite-v1`; camada criptográfica local e ciclo offsite Google Drive comprovados em 02/09/2026, pendentes apenas reconciliação final de CI, revisão de segurança da conta e aprovação de merge.

## Objetivo

Adicionar uma segunda cópia independente ao DR do Roda Festa, semanal, criptografada antes de sair da máquina local e mantida fora do computador que contém o backup diário.

Esta unidade complementa `docs/security/DR_POLICY_V1.md`.

## Baseline

Baseline de `main` no início desta frente:

`d56b568bc83d8d4d86b13b3685b7e0c5d8feb60c`

A RF-DR-POLICY-V1 já estava concluída, com:

- backup lógico diário em `D:\Backups\Roda-Festa\daily`;
- manifesto JSON;
- SHA-256 e tamanho;
- contagens da origem;
- restore real isolado comprovado;
- RPO V1 de 24h;
- RTO V1 de 4h;
- restore drill mensal;
- 14 gerações diárias locais como política mínima;
- nenhuma exclusão automática antes da segunda cópia comprovada.

## Escopo desta unidade

- criar artefato semanal criptografado a partir de um backup diário já validado;
- usar criptografia autenticada AES-256-GCM;
- criptografar o dump e o manifesto;
- gerar envelope operacional sem segredo;
- validar hash e tamanho dos artefatos cifrados;
- provar decifragem e igualdade do SHA-256 do dump original;
- apagar artefatos temporários da verificação;
- manter 4 gerações semanais após a política de retenção ser implementada e comprovada;
- armazenar uma cópia fora da máquina local após escolha explícita do destino offsite.

## Não faz parte desta primeira etapa

- enviar dumps brutos para nuvem;
- guardar chave em GitHub, Vercel, Supabase, documentação versionada ou chat;
- excluir backups antigos;
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
- a chave local pode ficar em `.env.backup.local`, que já é ignorado pelo Git;
- deve existir pelo menos uma cópia de recuperação da chave fora desta máquina antes de considerar a camada offsite comprovada;
- a cópia de recuperação deve ficar em local seguro e independente, como um gerenciador de senhas confiável ou outro cofre de segredos sob controle do responsável;
- perder a chave significa perder a capacidade de restaurar os backups cifrados.

Em 02/09/2026 a chave local foi gerada diretamente em `.env.backup.local`, sem impressão em terminal/chat, e validada apenas por formato:

- `WEEKLY_KEY_CREATED`;
- `WEEKLY_ENV_GATES_CONFIGURED`;
- `WEEKLY_KEY_FORMAT_OK`;
- `WEEKLY_KEY_BYTES=32`.

Em 02/09/2026 também foi comprovada uma cópia de recuperação da chave fora da máquina local, armazenada em gerenciador de senhas sincronizado. A evidência foi visual, com o valor secreto mantido oculto; nenhum conteúdo da chave foi registrado em Git, documentação ou chat.

## Destino semanal local de staging

Padrão Windows:

`D:\Backups\Roda-Festa\weekly`

Override opcional:

`RODA_FESTA_WEEKLY_BACKUP_DIR`

O script recusa destino dentro do repositório.

Este diretório é staging/local retention, não satisfaz sozinho o requisito offsite.

## Artefatos de cada geração

Para um backup de origem:

`roda-festa-production-<timestamp>-<commit>.dump`

são gerados:

1. `<arquivo>.dump.rfenc` — dump cifrado;
2. `<arquivo>.dump.json.rfenc` — manifesto cifrado;
3. `<arquivo>.dump.weekly.json` — envelope operacional sem a chave.

O envelope registra:

- formato;
- algoritmo;
- arquivo original;
- tamanho e SHA-256 do original;
- nomes dos arquivos cifrados;
- tamanho e SHA-256 dos arquivos cifrados;
- tamanho da tag de autenticação.

## Criação

Comando previsto:

```cmd
npm run backup:weekly:encrypt -- "D:\Backups\Roda-Festa\daily\<arquivo>.dump"
```

Gate explícito:

`ALLOW_RODA_FESTA_WEEKLY_ENCRYPTION=CREATE_ENCRYPTED_WEEKLY_COPY`

Antes de cifrar, o script exige:

- dump existente;
- manifesto existente;
- manifesto válido;
- tamanho real igual ao manifesto;
- SHA-256 real igual ao manifesto;
- chave válida de 32 bytes;
- destino fora do repositório;
- ausência de colisão com artefatos já existentes.

Se qualquer passo falhar, a geração não é considerada válida e os artefatos parciais são removidos.

## Evidência real de criação — 02/09/2026

Backup diário de origem previamente comprovado por restore:

`D:\Backups\Roda-Festa\daily\roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump`

Resultado da criação semanal:

- `RODA_FESTA_WEEKLY_ENCRYPTED_COPY_OK`;
- backup cifrado criado em `D:\Backups\Roda-Festa\weekly\roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump.rfenc`;
- manifesto cifrado criado em `D:\Backups\Roda-Festa\weekly\roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump.json.rfenc`;
- envelope criado em `D:\Backups\Roda-Festa\weekly\roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump.weekly.json`;
- SHA-256 do backup original: `fdf0f0722c9dfff652b7aafd52592442b279f9d41640d5097d58a9328e0bb42f`;
- SHA-256 do backup cifrado: `4f2d8684d53fa03ebdcb356f264986baaac95b98dffdc8038179be616f7affd1`;
- SHA-256 do manifesto cifrado: `b312da00ad3095d91037a172b4f8de1a8aad215da1e13cf156d4029f0dacc68d`.

## Verificação criptográfica

Comando previsto:

```cmd
npm run backup:weekly:verify -- "D:\Backups\Roda-Festa\weekly\<arquivo>.dump.weekly.json"
```

Gate explícito:

`ALLOW_RODA_FESTA_WEEKLY_VERIFY=VERIFY_ENCRYPTED_WEEKLY_COPY`

A verificação deve:

1. ler e validar o envelope;
2. localizar dump e manifesto cifrados;
3. validar SHA-256 e tamanho dos dois cifrados;
4. decifrar ambos em diretório temporário;
5. exigir autenticação AES-GCM válida;
6. recalcular SHA-256 do dump decifrado;
7. exigir igualdade com o backup original registrado;
8. validar o manifesto decifrado;
9. remover o diretório temporário ao final.

Resultado GREEN esperado:

- `RODA_FESTA_WEEKLY_ENCRYPTED_VERIFY_OK`;
- `WEEKLY_DECRYPTION_AUTHENTICATION_OK`;
- `WEEKLY_VERIFY_TEMP_REMOVED`.

## Evidência real de verificação local — 02/09/2026

A geração semanal acima foi verificada com sucesso:

- `RODA_FESTA_WEEKLY_ENCRYPTED_VERIFY_OK`;
- SHA-256 recuperado: `fdf0f0722c9dfff652b7aafd52592442b279f9d41640d5097d58a9328e0bb42f`;
- tamanho recuperado: `61165` bytes;
- `WEEKLY_DECRYPTION_AUTHENTICATION_OK`;
- `WEEKLY_VERIFY_TEMP_REMOVED`.

A igualdade de SHA-256 e tamanho prova que a cópia cifrada voltou exatamente aos bytes do backup original usado como origem.

## Prova adicional de recuperabilidade

A verificação criptográfica prova que a cópia cifrada consegue voltar exatamente aos bytes do backup original.

Ela não substitui o restore drill PostgreSQL. Periodicamente, uma geração semanal decifrada deve alimentar o mesmo fluxo de `restore:verify` já comprovado, mantendo a separação:

**integridade criptográfica → decifragem → integridade do dump → restore real isolado**.

## Segunda cópia off-machine

Destino V1 escolhido em 02/09/2026:

- provedor: Google Drive;
- pasta operacional: `Meu Drive / roda-festa / backups-semanais`;
- conta sob controle do responsável pelo projeto;
- somente artefatos já criptografados são enviados;
- o dump bruto e o `.env.backup.local` não são enviados.

Critérios mínimos preservados:

- ficar fora da máquina local;
- não ser o próprio Supabase;
- receber somente arquivos já cifrados;
- suportar pelo menos 4 gerações semanais;
- permitir recuperação/download sem depender do ambiente Production;
- acesso protegido por autenticação forte e, quando disponível, MFA/Verificação em duas etapas;
- exclusão e retenção só serão automatizadas após prova de recuperação.

## Evidência real do ciclo offsite — 02/09/2026

Foi enviada ao Google Drive uma geração completa contendo somente:

1. `roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump.rfenc`;
2. `roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump.json.rfenc`;
3. `roda-festa-production-2026-09-02T08-38-07Z-b3732a0.dump.weekly.json`.

A presença dos três arquivos na pasta offsite foi comprovada visualmente. Nenhum `.dump` bruto foi enviado.

Os três artefatos foram então baixados novamente do Google Drive e extraídos em diretório temporário isolado:

`C:\Temp\rf-offsite-verify`

A verificação foi executada contra o envelope **baixado da nuvem**, não contra a cópia original em `D:`.

Resultado:

- `RODA_FESTA_WEEKLY_ENCRYPTED_VERIFY_OK`;
- SHA-256 recuperado: `fdf0f0722c9dfff652b7aafd52592442b279f9d41640d5097d58a9328e0bb42f`;
- tamanho recuperado: `61165` bytes;
- `WEEKLY_DECRYPTION_AUTHENTICATION_OK`;
- `WEEKLY_VERIFY_TEMP_REMOVED`.

Portanto foi comprovado o ciclo:

**backup diário validado → criptografia autenticada → staging semanal no D: → upload de artefatos cifrados ao Google Drive → download da nuvem → validação de hash/tamanho → autenticação AES-256-GCM → decifragem → bytes originais idênticos → limpeza temporária.**

## Retenção V1

Meta aprovada:

- 1 geração semanal;
- manter 4 gerações semanais;
- nenhuma exclusão automática até que a operação recorrente seja observada e a política de retenção destrutiva tenha teste específico;
- manter por enquanto a geração local em `D:` mesmo depois do upload, além da cópia offsite.

## Gates desta frente

Antes de promover para `main`:

1. implementação criptográfica isolada — GREEN (CI #69);
2. round-trip criptográfico automatizado — GREEN (CI #69);
3. chave errada deve falhar fechada — GREEN (CI #69);
4. scripts não podem imprimir chave — GREEN (CI #69);
5. criação real de uma geração semanal cifrada — GREEN em 02/09/2026;
6. verificação real dessa geração — GREEN em 02/09/2026;
7. chave com cópia de recuperação fora da máquina — GREEN em 02/09/2026;
8. destino offsite escolhido — GREEN: Google Drive;
9. envio de uma geração cifrada ao destino offsite — GREEN em 02/09/2026;
10. download de volta a partir do destino offsite — GREEN em 02/09/2026;
11. verificação da cópia baixada — GREEN em 02/09/2026;
12. CI completo GREEN — GREEN histórico no run #69; novo CI do head documental final ainda deve ficar GREEN;
13. revisão de segurança da conta offsite (MFA/Verificação em duas etapas quando disponível) — pendente;
14. aprovação explícita antes do merge — pendente.

Até os gates aplicáveis desta V1 estarem comprovados, não declarar a segunda cópia offsite como concluída.
