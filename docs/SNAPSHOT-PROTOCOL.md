# Roda Festa - Protocolo de snapshots

Objetivo: nunca depender apenas da memória da conversa para recuperar o estado do projeto.

## Padrão operacional

O projeto Roda Festa usa **CMD** como terminal padrão. O snapshot é implementado em Node e acionado por:

```cmd
npm run snapshot
```

Não há dependência operacional de PowerShell para o fluxo de snapshot.

## Fechamento diário obrigatório

Antes de encerrar o dia de desenvolvimento:

1. Executar `npm run build` e, quando aplicável, `npm run lint`.
2. Conferir `git status --short` e revisar todo arquivo modificado ou não rastreado.
3. Atualizar `docs/FINDINGS.md`, `docs/DECISIONS.md` e `docs/WORKLOG.md` com o que realmente aconteceu.
4. Fazer o commit técnico necessário.
5. Se o FINDINGS ou o WORKLOG precisarem registrar o hash/checkpoint técnico, fazer a reconciliação documental em commit posterior.
6. Confirmar `git status --short` sem saída.
7. Somente então executar `npm run snapshot`.
8. Guardar o ZIP gerado fora do repositório e/ou enviar para a conversa do projeto.

## Regra crítica

**Nunca gerar snapshot entre um commit técnico importante e a reconciliação documental que registra aquele checkpoint.**

O script também bloqueia a geração quando a working tree não está limpa.

## Conteúdo do snapshot

O snapshot contém apenas arquivos rastreados pelo Git no checkpoint atual, acrescidos de `SNAPSHOT-MANIFEST.txt`.

Por consequência, não inclui automaticamente:

- `.git`;
- `node_modules`;
- `dist` e outros artefatos ignorados;
- arquivos locais não rastreados;
- `.env` e secrets, desde que permaneçam corretamente ignorados e nunca sejam commitados.

O nome do ZIP contém a data e o hash curto do commit.

## Local de saída

Por padrão, o ZIP é criado em uma pasta irmã do repositório:

```text
C:\Projetos\roda-festa-snapshots\
```

O caminho é calculado automaticamente a partir da localização real do repositório.

## Secrets

Nunca inserir no snapshot, Git, FINDINGS ou conversa:

- chaves de API;
- tokens;
- cookies/sessões;
- senhas;
- conteúdo de `.env`;
- credenciais de Vercel/Resend.

Documentar apenas o **nome** das variáveis necessárias, nunca seus valores.
