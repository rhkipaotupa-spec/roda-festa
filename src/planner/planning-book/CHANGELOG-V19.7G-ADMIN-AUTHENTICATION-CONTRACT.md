# V19.7G — Admin Authentication Contract

Base obrigatória: `ddc6caec202c037d8e7b0cf2d11aa82a18e44c6d`.

Objetivo: estabelecer o contrato de autenticação administrativa antes de criar login visual, sessão real de provedor ou endpoints Admin globais.

Entregue:
- token administrativo lido apenas de cookie configurado;
- resolver de sessão server-side obrigatório e fail-high quando ausente;
- principal administrativo construído somente a partir de identidade confiável resolvida no servidor;
- validação de `issuedAt` / `expiresAt` e rejeição de sessão expirada ou inválida;
- contrato de cookie `HttpOnly`, `SameSite=Lax`, `Secure` em produção e `Path=/admin`;
- token opaco não é devolvido no objeto autenticado;
- integração contratual com a Admin Authorization Boundary;
- testes negativos e de composição.

Deliberadamente NÃO entregue nesta unidade:
- tela de login;
- emissão real de sessão;
- armazenamento de usuários/senhas;
- secrets no código;
- endpoint Admin global;
- banco remoto;
- migration.
