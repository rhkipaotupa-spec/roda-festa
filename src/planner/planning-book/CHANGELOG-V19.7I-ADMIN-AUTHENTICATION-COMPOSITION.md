# V19.7I — Admin Authentication Composition

## Objetivo

Compor, exclusivamente no servidor, as três fundações administrativas já criadas:

1. Admin Authentication Contract;
2. Admin Session Repository;
3. Admin Authorization Boundary.

A unidade não cria login visual, endpoint administrativo global, credenciais, secrets,
persistência remota ou migration.

## Propriedades

- o navegador apresenta somente o cookie opaco de sessão;
- o token é resolvido pelo Session Repository;
- role e capabilities vêm exclusivamente da sessão confiável;
- o principal normalizado alimenta a Authorization Boundary;
- ausência de cookie, token desconhecido, sessão expirada ou revogada falham fechados;
- capability ausente continua bloqueada;
- rotação invalida o token anterior;
- resultados de autenticação/autorização não expõem token bruto nem tokenHash.

## Limites deliberados

Esta unidade ainda não implementa:
- formulário ou fluxo de login;
- emissão HTTP real do cookie;
- endpoint Admin global;
- banco remoto;
- adapter persistente de produção;
- migration.

A finalidade é provar a composição das fronteiras antes de conectá-las à superfície HTTP.
