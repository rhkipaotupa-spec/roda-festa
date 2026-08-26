# V19.7Y — Admin Browser Login Wiring

Base obrigatória: `156cc5149a8ace0eb701d61adec30fd5cfb68274`.

## Objetivo

Conectar a superfície visual `/admin` ao endpoint real `/api/admin-login`, preservando o contrato de autenticação já comprovado contra o Supabase.

## Entregue

- `POST /api/admin-login` via `fetch` same-origin;
- payload restrito a `identifier` e `credential`;
- `credentials: same-origin` para aceitar o cookie administrativo;
- estado de loading e bloqueio contra duplo submit;
- erro público neutro, sem propagar códigos internos;
- limpeza da senha do estado React após sucesso;
- confirmação visual de sessão autenticada;
- sem navegação falsa para dashboard ainda inexistente;
- nenhuma chave Supabase ou secret no frontend.

## Limite visual

A identidade visual atual do Admin continua explicitamente **não aprovada**. A harmonização com o Planning Book será uma unidade posterior, separada do fechamento funcional e de segurança do login.

## Preview

O teste de navegador deve ser feito pelo domínio estável da branch permitido em `RODA_FESTA_ADMIN_ALLOWED_ORIGINS`, e não pelo domínio efêmero específico de um deployment.
