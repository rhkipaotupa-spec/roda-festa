# GIT E BACKUP — ENCERRAMENTO DA SESSÃO 03/08/2026

## 1. Salvar no VS Code

Use `Ctrl + K`, depois `S` para salvar todos os arquivos.

## 2. Conferir o projeto

```bash
npm run dev
```

Teste:

- Welcome;
- transição;
- Planning Book;
- geração da sugestão;
- investimento;
- cena atual.

## 3. Conferir alterações

```bash
git status
```

## 4. Criar commit da sessão

```bash
git add .
git commit -m "Evolui Planning Book e prepara Cena Viva v2"
```

## 5. Criar tag de segurança opcional

```bash
git tag -a planning-book-v1.0 -m "Planning Book funcional antes da Cena Viva v2"
```

## 6. Enviar para o repositório remoto

```bash
git push
git push origin planning-book-v1.0
```

## 7. Criar backup ZIP local

No PowerShell, a partir da pasta que contém o projeto:

```powershell
Compress-Archive -Path .\roda-festa\* -DestinationPath .\roda-festa-backup-2026-08-03.zip -Force
```

Não inclua `node_modules` se o ZIP ficar muito grande. Nesse caso, copie apenas:

- `src/`;
- `public/`;
- `docs/`;
- `package.json`;
- `package-lock.json`;
- arquivos de configuração.

## 8. Manter três cópias

1. pasta local;
2. Git remoto privado;
3. ZIP em Google Drive ou OneDrive.

## 9. Como retomar

```bash
git status
git pull
npm install
npm run dev
```

Leia primeiro:

```text
docs/SESSION_HANDOFF.md
```
