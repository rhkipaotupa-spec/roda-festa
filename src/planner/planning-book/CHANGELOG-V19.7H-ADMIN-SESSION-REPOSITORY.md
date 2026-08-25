# V19.7H — Admin Session Repository

Base obrigatória: `8c629305d268d29c71e87765bb45f0f084b9d3bd`.

Objetivo: criar a fundação de armazenamento de sessão administrativa sem escolher provedor remoto nem implementar login visual.

Entregue:
- token opaco de alta entropia;
- persistência somente do hash do token;
- contrato provider-agnostic de repository;
- criação, resolução, revogação e rotação de sessão;
- expiração server-side;
- adapter em memória exclusivo para testes e proibido em produção por padrão;
- testes de segurança e ciclo de vida.

Deliberadamente NÃO entregue:
- senha/login real;
- secrets no repositório;
- endpoint Admin global;
- banco remoto;
- migration.

A próxima integração real de identidade poderá usar este repository sem alterar a Authorization Boundary nem o Authentication Contract.
