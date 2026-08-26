# V19.7V — First Admin Bootstrap Provisioning

Base obrigatória: `7a77ae4d29f4530f70203a0172579ceb5c31c930`.

## Objetivo

Criar um mecanismo local, one-time e fail-high para gerar o material de provisionamento da primeira identidade Admin sem colocar senha ou secrets no Git e sem fazer escrita remota automática.

## Propriedades

- e-mail normalizado;
- senha exigida interativamente em TTY e sem eco;
- confirmação obrigatória de senha;
- política mínima: 16 caracteres, maiúscula, minúscula, número e símbolo;
- hashing reutiliza `hashAdminCredential()` com salt criptográfico aleatório;
- SQL é gerado somente em pasta temporária do sistema;
- arquivo temporário recebe permissão restrita quando suportado;
- senha bruta não é gravada no SQL;
- bootstrap recusa execução se já existir qualquer linha em `admin_users`;
- primeiro papel fixo: `OWNER`;
- capabilities iniciais vazias;
- nenhuma service-role, connection string ou chamada remota é usada;
- nenhuma credencial real é versionada.

## Fora de escopo

- executar o bootstrap real;
- inserir o primeiro Admin no Supabase;
- configurar secrets na Vercel;
- ligar o formulário visual;
- liberar funcionalidades administrativas adicionais.
