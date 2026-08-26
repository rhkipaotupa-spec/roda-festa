# V19.7ZA — Admin Cookie Path Restore

Base obrigatória: `fadcb572f7324c34ec50032d1bacd750322bba76`.

## Achado real

O smoke de navegador da V19.7Z comprovou que o cookie `rf_admin_session`
persistia após login, mas a restauração falhava depois de `Ctrl+R`.

Causa: o contrato emitia `Path=/admin`, enquanto a restauração consulta
`GET /api/admin-session`. Pelas regras de cookie do navegador, um cookie
restrito a `/admin` não acompanha uma requisição para `/api/admin-session`.

## Correção

O cookie administrativo passa a usar `Path=/`.

As proteções que continuam obrigatórias:
- `HttpOnly`;
- `SameSite=Lax`;
- `Secure` em produção;
- token opaco;
- sessão resolvida server-side;
- allowlist/origin nas mutações;
- nenhum token acessível ao JavaScript.

O cookie de logout/limpeza usa o mesmo `Path=/`.

## Migração do cookie legado

Cookies antigos com o mesmo nome e `Path=/admin` podem permanecer até sua
expiração natural. Eles não acompanham `/api/admin-session`. Um novo login
após este deploy emitirá o cookie atual com `Path=/`, que é o utilizado pelos
endpoints administrativos sob `/api`.

Nenhum valor de cookie deve ser copiado para documentação, Git ou conversa.

## Prova pendente

Após deploy em Preview:
1. fazer um novo login para receber o cookie com o contrato atualizado;
2. confirmar sessão ativa;
3. executar `Ctrl+R`;
4. confirmar restauração sem solicitar credenciais novamente.
