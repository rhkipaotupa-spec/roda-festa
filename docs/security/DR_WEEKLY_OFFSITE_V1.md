# Roda Festa — Weekly Encrypted Offsite V1

Status: implementação em validação na branch `chore/dr-weekly-offsite-v1`.

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

- escolher automaticamente um provedor de nuvem;
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

## Prova adicional de recuperabilidade

A verificação criptográfica prova que a cópia cifrada consegue voltar exatamente aos bytes do backup original.

Ela não substitui o restore drill PostgreSQL. Periodicamente, uma geração semanal decifrada deve alimentar o mesmo fluxo de `restore:verify` já comprovado, mantendo a separação:

**integridade criptográfica → decifragem → integridade do dump → restore real isolado**.

## Segunda cópia off-machine

O provedor ainda será escolhido deliberadamente.

Critérios mínimos:

- ficar fora da máquina local;
- não ser o próprio Supabase;
- receber somente arquivos já cifrados;
- suportar pelo menos 4 gerações semanais;
- permitir recuperação/download sem depender do ambiente Production;
- acesso protegido por MFA quando disponível;
- exclusão e retenção só serão automatizadas após prova de recuperação.

Possibilidades práticas incluem OneDrive, Google Drive ou outro storage sob controle do responsável. Nenhuma opção está aprovada até validação explícita.

## Retenção V1

Meta aprovada:

- 1 geração semanal;
- manter 4 gerações semanais;
- nenhuma exclusão automática enquanto a cópia offsite e a recuperação da chave não estiverem comprovadas.

## Gates desta frente

Antes de promover para `main`:

1. implementação criptográfica isolada — pendente de CI;
2. round-trip criptográfico automatizado — pendente de CI;
3. chave errada deve falhar fechada — pendente de CI;
4. scripts não podem imprimir chave — pendente de CI;
5. criação real de uma geração semanal cifrada — pendente;
6. verificação real dessa geração — pendente;
7. chave com cópia de recuperação fora da máquina — pendente;
8. destino offsite escolhido — pendente;
9. envio de uma geração cifrada ao destino offsite — pendente;
10. download de volta a partir do destino offsite — pendente;
11. verificação da cópia baixada — pendente;
12. CI completo GREEN — pendente;
13. aprovação explícita antes do merge — pendente.

Até os gates aplicáveis desta V1 estarem comprovados, não declarar a segunda cópia offsite como concluída.
