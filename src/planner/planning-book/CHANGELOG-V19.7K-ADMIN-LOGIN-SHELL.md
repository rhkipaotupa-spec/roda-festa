# V19.7K — Admin Login Shell

Base obrigatória: `52522b5c063b696a38d594819424787e64aeb105`.

Primeira superfície visual administrativa do Roda Festa.

## Entregue
- rota `/admin`;
- shell visual mobile-first;
- campos de e-mail e senha semanticamente corretos;
- feedback explícito de que credenciais reais ainda não estão ativadas;
- nenhuma alteração nas rotas públicas existentes;
- testes estruturais para impedir autenticação simulada ou secrets no frontend.

## Deliberadamente não entregue
- login real;
- usuário/senha real;
- chamada HTTP de autenticação;
- dashboard Admin;
- consulta global de jornadas;
- banco remoto;
- migration.

Esta unidade permite avaliar visualmente a entrada Admin sem fingir que a autenticação já está operacional.
