# V19.7F — Admin Authorization Boundary

Base obrigatória: `7b233c56f2ae788f439135f0fee51a8efab838d3`.

Objetivo: criar a fronteira de autorização administrativa antes de qualquer endpoint Admin global.

Entregue:
- principal administrativo normalizado;
- bloqueio fail-closed sem autenticação;
- roles administrativas explícitas;
- capability opcional por operação;
- bloqueio de conta inativa;
- boundary reutilizável para futuras rotas;
- testes específicos de regressão.

Deliberadamente NÃO entregue nesta unidade:
- tela de login;
- sessão administrativa real;
- endpoint de listagem Admin;
- banco remoto;
- migration.

A próxima unidade poderá conectar autenticação real a esta fronteira sem espalhar regras de acesso pela API.
