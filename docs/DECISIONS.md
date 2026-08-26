# Roda Festa - DECISIONS

Decisões de produto e arquitetura que devem sobreviver às conversas e orientar alterações futuras.

## 2026-08-24 - Site institucional preservado

O site institucional atual é considerado aprovado. A V19 concentra a refatoração no Planner. Alterações no site só devem ocorrer quando uma integração do Planner exigir e devem ser explicitamente justificadas.

## 2026-08-24 - Planner mobile-first, uma etapa por tela

A experiência principal do Planner é celular. Cada momento da jornada ocupa uma tela própria. Não manter página anterior, visualização paralela ou múltiplas zonas competindo pela atenção apenas para preservar o conceito antigo de livro aberto.

Fluxo-base:

`Welcome -> Informações -> Cardápio -> Ajustes -> Validação -> Conclusão`

A identidade visual do livro pode continuar em textura, transições e linguagem, mas não determina mais a arquitetura de navegação.

## 2026-08-24 - Carrinho de consignação é estrutura cobrada

Se um grupo operacional exige um carrinho, esse carrinho compõe a estrutura paga, inclusive bebidas em consignação. A consignação se aplica ao consumo das bebidas, não à gratuidade do equipamento/estrutura.

## 2026-08-24 - Snapshot imutável da proposta

Ao concluir o planejamento, criar uma representação imutável com código, cliente, convidados, itens, quantidades, preços aplicados, carrinhos, serviços, consignação e total. A via do cliente e a via interna devem derivar do mesmo snapshot.

## 2026-08-24 - Preços de tortas/porções de 150 g

Tabela vigente a partir desta versão:

| Item | Preço / 150 g |
| --- | ---: |
| Cebola caramelizada com queijo | R$ 7,00 |
| Strogonoff de frango | R$ 7,00 |
| Frango com catupiry | R$ 7,00 |
| Frango com cream cheese e ervas | R$ 7,00 |
| Palmito com catupiry | R$ 9,00 |
| Camarão com catupiry | R$ 15,00 |
| Carne louca com cheddar | R$ 15,00 |
| Bacalhau com catupiry | R$ 15,00 |

## 2026-08-24 - Lint não deve forçar refatoração visual do site congelado

O site institucional está aprovado e fora do escopo funcional da V19. Regras novas do ESLint que acusam padrões preexistentes de `setState` em efeitos nas cenas institucionais não justificam alterar comportamento visual apenas para obter baseline verde.

A configuração pode conter exceções **específicas e documentadas por arquivo** para legado aprovado. Código novo do Planner e da API continua sujeito ao baseline normal. A exceção não deve ser ampliada globalmente sem finding e decisão explícita.


## 2026-08-24 - Mobile-first não elimina a identidade de caderno

A decisão “uma etapa por tela” permanece. O que muda é a linguagem visual: cada etapa deve parecer uma página do Planner Roda Festa, com assinatura vinho/dourado, papel, profundidade e hierarquia editorial. A interface não deve voltar ao livro aberto com múltiplas páginas competindo pela atenção, mas também não deve se reduzir a um formulário genérico.

## 2026-08-24 - Recomendação é ponto de partida totalmente editável

A recomendação automática nunca é uma composição fechada. Na etapa de ajustes, a pessoa deve poder, dentro do catálogo e das regras operacionais disponíveis:

- aumentar ou reduzir quantidade;
- trocar um item/sabor por outro da categoria;
- adicionar outro item à categoria;
- retirar um item;
- retirar uma categoria inteira;
- adicionar uma categoria ausente;
- ativar/desativar serviços opcionais.

Toda alteração deve recalcular imediatamente itens, carrinhos, equipe, horas adicionais, consignação e investimento usando a mesma fonte de verdade do motor.

## 2026-08-24 - Welcome clássico é referência visual congelada

A capa/welcome de referência é a versão marrom-escura tipo caderno premium, com lombada, molduras douradas, textura discreta, logo creme, título “Meu Planejamento”, campos de nome/telefone/data e CTA dourado. A V19 pode simplificar a navegação interna, mas não deve descaracterizar essa entrada sem aprovação explícita.

## 2026-08-24 - Data de evento nunca pode ser anterior ao dia corrente

O Planner deve bloquear no componente e também na lógica qualquer data anterior à data local atual. A validação não pode depender apenas do seletor nativo do navegador.

## 2026-08-24 - Via interna deve ser o mesmo PDF canônico entregue ao cliente

Não basta receber apenas JSON/snapshot ou uma reconstrução posterior. O sistema deve gerar um artefato canônico a partir do snapshot imutável e usar exatamente esse artefato para a via do cliente e a via interna da Roda Festa. A implementação final deve permitir prova de equivalência por identificador/hash e persistência durável.

## 2026-08-25 - Cliente sem login obrigatório; jornada identificada por sessão server-side

A geração de proposta deve continuar com baixo atrito. A cliente não será obrigada a criar usuário/senha para usar o Planner.

A arquitetura futura criará uma `PlanningSession` anônima no servidor. Telefone/e-mail podem vincular a sessão a um contato. Recuperação em outro dispositivo poderá usar link mágico/código temporário.

Login tradicional poderá ser oferecido no futuro, mas não é pré-requisito arquitetural para histórico confiável.

## 2026-08-25 - Admin no mesmo produto, com autenticação obrigatória

A Central Roda Festa fará parte do mesmo produto e backend, em rota dedicada `/admin`, evitando duplicação de catálogo, regras e infraestrutura.

O Admin terá autenticação e autorização server-side antes de qualquer dado real ser exposto. A primeira fase pode ter apenas perfil `OWNER`; arquitetura preserva expansão para `COMMERCIAL` e `OPERATION`.

## 2026-08-25 - Commercial Ledger é a fonte financeira canônica

O orçamento oficial passa a ser representado por linhas discriminadas de produto/serviço. O total é consequência da soma dessas linhas.

Planner, Admin, PDF e integrações não devem recalcular o orçamento de forma independente.

Uma proposta nova só é íntegra quando a reconciliação do ledger resulta em diferença zero.

## 2026-08-25 - Servidor é autoridade do preço oficial

O navegador transmite escolhas e quantidades, não a verdade financeira.

Na submissão oficial, o servidor reconstrói os produtos pelo catálogo confiável e recalcula estrutura, serviços e total. Valores enviados pelo frontend são apenas comparáveis; divergências devem ser rejeitadas e auditadas.

## 2026-08-25 - Recomendação original é evidência imutável

Quando o motor produz uma sugestão, essa versão deve ser congelada antes de qualquer edição. A proposta final não substitui a recomendação original.

O histórico futuro deve permitir comparar entrada, recomendação, alterações, final e pós-evento.

## 2026-08-25 - Eventos reais calibram o motor, mas não o alteram automaticamente

A base real é evidência para versões candidatas do recomendador. Nenhum evento isolado muda automaticamente a regra em produção.

Novas versões devem ser simuladas retrospectivamente e revisadas pela Roda Festa antes de promoção.

## 2026-08-25 - Padrão oficial de atualização local

O projeto oficial existe somente em `C:\Projetos\roda-festa`.

Toda atualização gerada externamente deve ser aplicada por uma única pasta temporária descartável: `C:\Temp\rf-update`.

Regras permanentes:

- antes de cada nova atualização, limpar/recriar `C:\Temp\rf-update`;
- não criar clones `roda-festa-vXX` em `C:\Projetos`;
- pacotes devem ser autocontidos e preferencialmente trazer `apply-update.cmd` e `validate-update.cmd`;
- `apply-update.cmd` deve validar branch, commit-base e working tree antes de alterar arquivos;
- aplicar somente arquivos completos explicitamente previstos, sem `/MIR` destrutivo e sem edição parcial;
- `validate-update.cmd` executa os gates técnicos aplicáveis antes de commit;
- histórico oficial fica em Git + documentação + snapshots, não em cópias de pastas;
- após aplicação/validação/commit, a pasta temporária pode ser removida.

## 2026-08-25 - Persistencia do Roda Festa nao pode depender da infraestrutura do Simplify

O Roda Festa nao deve exigir pausa, exclusao, reconfiguracao ou reducao de seguranca de nenhum ambiente do Simplify para viabilizar seu desenvolvimento.

Regras permanentes:

- os projetos `simplify` e `simplify-runtime-security` sao infraestrutura independente e nao sao recurso disponivel para liberar capacidade do Roda Festa;
- eventual upgrade de plano/provedor sera decisao futura de custo-beneficio, nunca atalho para contornar limite durante desenvolvimento;
- migrations do Roda Festa nao devem ser executadas em banco do Simplify;
- credenciais, service role keys, connection strings e secrets nao entram em Git, documentacao ou pacotes de atualizacao.

## 2026-08-25 - Dominio de PlanningSession desacoplado do provedor de persistencia

A camada de dominio da jornada nao deve depender diretamente de Supabase.

A V19.7A estabelece um contrato de repositorio para `PlanningSession`, com adapters substituiveis. O adapter em memoria existe somente para testes/controlabilidade e nao e persistencia de producao. O adapter Supabase permanece preparado, porem inativo ate existir infraestrutura aprovada.

Consequencias:

- regra de negocio e seguranca podem ser testadas sem banco remoto;
- troca futura de provedor nao exige reescrever o dominio;
- ausencia de configuracao de producao deve falhar alto, nunca cair silenciosamente para memoria;
- migration pode permanecer versionada sem ser aplicada;
- ativacao de persistencia real sera uma unidade separada, explicitamente validada.

## 2026-08-25 - PlanningChange é timeline de negócio append-only

O histórico da jornada deve registrar mudanças comercialmente relevantes sem sobrescrever fatos anteriores.

A timeline de `PlanningChange` segue estas regras:

- eventos são append-only;
- ordem é preservada;
- cada evento recebe ator e timestamp normalizados no servidor;
- o navegador não é autoridade de timestamp, ator ou sequência;
- ownership exige a mesma identidade segura da `PlanningSession`;
- mutações usam versão esperada para detectar concorrência;
- novas mudanças são bloqueadas após a finalização;
- a timeline explica a jornada, mas não substitui o cálculo financeiro autoritativo do servidor.

A finalidade é permitir reconstruir de forma auditável:

`entrada -> recomendação original -> alterações -> proposta final`.

## V19.7D — Decisões — `ce536b4ec42824eb904fdb4fcfb1353c4a2105eb`

- Adotar um Journey Read Model explícito para reconstrução da jornada sem recalcular fatos históricos.
- Manter separação entre escrita/transação e leitura/explicabilidade.
- Exigir ownership também na leitura da jornada.
- Tratar `snake_case` persistido e `camelCase` normalizado como formatos de entrada válidos do read model, sem duplicar regra comercial.
- Não ativar persistência remota e não executar migrations como parte da V19.7D.
- Considerar a unidade concluída somente após testes, lint e build verdes.

## V19.7E — Decisões — `2852f946e2f9430afdc247f093ba2c421c035ecb`

- Criar primeiro um contrato Admin derivado e testável antes de expor qualquer endpoint administrativo.
- Não recalcular totais ou reconciliação na camada de query; transportar fatos já produzidos pela camada autoritativa.
- Não criar listagem administrativa global antes da definição de autenticação/autorização Admin.
- Manter persistência remota desligada e não executar migrations nesta unidade.
- Considerar a V19.7E concluída com 48/48 testes, lint e build verdes.

## V19.7F — Decisões — `58bba0cb009d2823efa65d615fe9799990e74924`

- Criar a fronteira de autorização antes de qualquer endpoint administrativo global.
- Adotar comportamento fail-closed na ausência de autenticação, role válida ou capability necessária.
- Centralizar roles/capabilities em um boundary reutilizável, evitando regras espalhadas pela API.
- Não criar login, sessão Admin real ou listagem administrativa nesta unidade.
- Não ativar banco remoto e não executar migrations.
- Considerar a unidade concluída somente com 55/55 testes, lint e build verdes.

## V19.7G — Decisões — `2e08ee32042de8cd5614091a49371975b7761c37`

- Separar autenticação de autorização: autenticação produz principal; Authorization Boundary decide acesso.
- Não confiar em role, capability ou identidade fornecida pelo navegador.
- Resolver sessão administrativa exclusivamente server-side.
- Fazer a camada de autenticação nascer provider-agnostic, sem escolher prematuramente um provedor de identidade.
- Rejeitar sessão expirada e configuração de tempo de vida inválida.
- Definir cookie administrativo HttpOnly, SameSite=Lax e Secure em produção.
- Não criar login real, secrets, endpoint Admin global, banco remoto ou migration nesta unidade.
- Considerar a unidade concluída somente com 63/63 testes, lint e build verdes.

## V19.7H — Decisões — `eb1713d82f937ceaf0dbe94f736336cff3a8e135`

- Persistir somente hash de token administrativo, nunca o token bruto.
- Tratar sessão administrativa como domínio próprio, independente do provedor futuro.
- Exigir expiração server-side e revogação imediata.
- Implementar rotação de token invalidando o token anterior.
- Proibir adapter em memória em produção por padrão.
- Não criar login real, secrets, endpoint Admin global, banco remoto ou migration nesta unidade.
- Considerar a unidade concluída somente com 72/72 testes, lint e build verdes.

## V19.7I — Decisões — `b9b847c0ebf117451ae25a2aa2e1309ccd505d8c`

- Compor autenticação, sessão e autorização em uma única camada server-side sem fundir responsabilidades.
- Manter o navegador restrito ao cookie opaco de sessão.
- Derivar role/capabilities somente de sessão confiável resolvida no servidor.
- Preservar fail-closed para ausência de cookie, token inválido, sessão expirada/revogada e capability insuficiente.
- Não expor token bruto nem tokenHash nos resultados da composição.
- Não criar login visual, secrets, endpoint Admin global, banco remoto ou migration nesta unidade.
- Considerar a unidade concluída somente com 82/82 testes, lint e build verdes.

## V19.7J — Decisões — `3334f7444650b2d93001e1f7d9bd75ec0251d0ef`

- Criar primeiro uma boundary HTTP mínima antes da UI de login.
- Manter `credentialVerifier` injetado e server-side, sem credenciais fixas no código.
- Restringir login/logout/refresh a POST e exigir Origin confiável.
- Emitir cookie administrativo somente via `Set-Cookie`, com HttpOnly, SameSite=Lax, Path=/admin e Secure em produção.
- Revogar sessão no logout e rotacionar token no refresh.
- Ignorar role/capabilities fornecidas pelo cliente e confiar somente na identidade verificada server-side.
- Não expor token bruto, tokenHash ou credential nas respostas.
- Não criar login visual, secrets, endpoint Admin global, banco remoto ou migration nesta unidade.
- Considerar a unidade concluída somente com 92/92 testes, lint e build verdes.

## V19.7K — Decisões — `5381ffc5de873781b6e976de53537b98190837ca`

- Introduzir `/admin` primeiro como shell visual, sem fingir autenticação real.
- Preservar todas as rotas públicas existentes.
- Priorizar funcionalidade e arquitetura antes do refinamento de branding.
- Não embutir credenciais, usuários ou secrets no frontend.
- Não conectar ainda o formulário a um mecanismo real de credenciais.
- Manter dashboard, consulta global de jornadas, banco remoto e migrations fora desta unidade.
- Registrar o placeholder `RF` como provisório; logo oficial e acabamento visual serão refinados posteriormente.
- Considerar a unidade aprovada após baseline 96/96 + lint + build e teste visual real no celular.

## V19.7L — Decisões — `4103e39b99b36bce9381a6d1a590a772cb90533d`

- Validar credenciais somente server-side.
- Usar `scrypt` com salt para a representação persistível de credenciais.
- Não normalizar a senha; apenas o identificador administrativo.
- Retornar o mesmo resultado neutro para usuário inexistente e senha incorreta.
- Derivar role/capabilities somente do registro confiável resolvido server-side.
- Não expor hash, salt ou credencial após autenticação.
- Não incluir usuário/senha real, secrets, endpoint novo, banco remoto ou migration nesta unidade.
- Considerar a unidade concluída somente com 106/106 testes, lint e build verdes.

## V19.7M — Decisões — `0b474af7a12871fa56dcd01a1da71056b0fa773e`

- Introduzir uma composição explícita entre verifier server-side e HTTP Boundary antes de expor uma rota pública de login.
- Manter o verifier como dependência confiável server-side, nunca substituível por dados do request.
- Preservar a resposta da HTTP Boundary sem vazar dependências internas.
- Não criar usuário/senha real, secret, endpoint novo, `fetch` no frontend, banco remoto ou migration nesta unidade.
- Considerar a unidade concluída somente com 111/111 testes, lint e build verdes.

## V19.7M1 — Decisões — `7f43a827e5ead6e63d10022412e08130ddfb479b`

- Não avançar para o endpoint V19.7N enquanto a composição não estivesse comprovada contra a HTTP Boundary real.
- Injetar `credentialVerifier` na construção da boundary, conforme o contrato real.
- Manter o request do cliente fora da composição de dependências de autenticação.
- Exigir teste de integração real para a cadeia credencial → verifier → boundary → sessão → cookie.
- Preservar fail-closed para credencial incorreta e Origin não confiável.
- Não criar credenciais reais, secrets, endpoint novo, `fetch` no frontend, banco remoto ou migration nesta correção.
- Considerar a correção concluída somente com 114/114 testes, lint e build verdes.

## V19.7N — Decisões — `640100e906652d98c725ac1e9d13ba48842062ed`

- Criar primeiro o endpoint HTTP isolado antes de conectar o frontend.
- Manter o handler padrão fail-closed em 503 até o wiring real do runtime.
- Transportar `Set-Cookie` somente a partir do resultado da composição server-side.
- Mapear erros internos para respostas públicas controladas sem vazar detalhes.
- Não diferenciar publicamente usuário inexistente de senha incorreta.
- Não criar usuário/senha real, secrets, `fetch` no frontend, banco remoto ou migration nesta unidade.
- Considerar a unidade concluída somente com 121/121 testes, lint e build verdes.

## V19.7O — Decisões — `bbd9ddf422822890d296216e33b12223b606760f`

- Preservar explicitamente `/api/*` antes do fallback da SPA na Vercel.
- Não avançar para wiring real do login enquanto a topologia de deploy não mantiver a API acessível.
- Proteger por teste a ordem entre regra de API e fallback SPA.
- Não introduzir `builds` ou `routes` legados.
- Não criar runtime real, credenciais, secrets, `fetch` no frontend, banco remoto ou migration nesta unidade.
- Considerar a unidade concluída somente com 124/124 testes, lint e build verdes.

## V19.7P — Decisões — `8db1e991f62329da29fc580ec79d5a776c9d241b`

- Separar persistência de identidade Admin e persistência de sessão Admin.
- Usar Supabase server-side como backend persistente dos dois domínios.
- Persistir apenas hash de token de sessão, nunca o token bruto.
- Manter `SUPABASE_SERVICE_ROLE_KEY` restrita ao servidor.
- Falhar alto quando configuração Supabase estiver ausente.
- Não expor corpo remoto nem segredo em erros.
- Não criar migration, tabelas remotas, usuário/senha real, hash real, secret, wiring do runtime ou `fetch` no frontend nesta unidade.
- Considerar a unidade concluída somente com 136/136 testes, lint e build verdes.

## V19.7Q — Decisões — `ea839646658293301b812006dff7adc5a6438329`

- Centralizar a montagem do runtime Admin em uma factory server-side.
- Exigir configuração persistente e `fetch` válido já na criação do runtime.
- Proibir fallback implícito para sessão Admin em memória.
- Não expor env ou service-role no objeto público do runtime.
- Integrar identity store, verifier, session repository, authorization boundary, authentication composition e login composition em uma cadeia explícita.
- Não ligar ainda o handler padrão `api/admin-login.js`.
- Não criar migration, tabelas remotas, usuário/senha real, hash real, secrets ou `fetch` no frontend nesta unidade.
- Considerar a unidade concluída somente com 142/142 testes, lint e build verdes.

## V19.7R — Decisões — `ff5f597dd40ed6f31a95d99d14c2cf3012dc026c`

- Ligar o endpoint Admin ao runtime persistente somente após a composição completa da V19.7Q.
- Criar o runtime no servidor com `process.env` e `globalThis.fetch`.
- Converter indisponibilidade de runtime em resposta pública 503 neutra.
- Não vazar stack, mensagem interna ou secret.
- Preservar o HTTP handler existente para adaptação request/response e cookie.
- Não criar migration, tabelas remotas, usuário/senha real, hash real, secrets ou ligação do frontend nesta unidade.
- Considerar a unidade concluída somente com 147/147 testes, lint e build verdes.

## V19.7S — Decisões — `e969d23880aaf805c609255511b60b916aab5e67`

- Derivar o schema exclusivamente dos contratos já aprovados dos adapters Admin.
- Versionar o SQL antes de qualquer execução remota.
- Não armazenar senha bruta nem token bruto.
- Tornar `identifier` e `token_hash` únicos.
- Habilitar RLS e remover privilégios de `anon` e `authenticated`.
- Não criar policy aberta para clientes.
- Não executar migration remota, criar tabela real, credencial real ou secret nesta unidade.
- Considerar a unidade concluída somente com 154/154 testes, lint e build verdes.

## V19.7T — Decisões — `5800452fbedf5a7bdf07d48e31500ba5feba2a12`

- Introduzir uma etapa formal de preflight antes de qualquer materialização Admin.
- Parar imediatamente se `admin_users` ou `admin_sessions` já existirem.
- Manter o guard estritamente read-only.
- Verificar pós-materialização: existência das tabelas, RLS, ausência de policies abertas, ausência de grants para `anon/authenticated` e índices obrigatórios.
- Não instalar Supabase CLI nem executar SQL remoto nesta unidade.
- Não criar usuário/senha real nem versionar secrets.
- Corrigir o teste read-only para ignorar comentários SQL, preservando o arquivo guard sem alteração.
- Considerar a unidade concluída somente com 161/161 testes, lint e build verdes.

## V19.7U — Decisão de materialização Admin

A primeira materialização remota do contrato Admin foi autorizada somente após preflight read-only comprovar ausência das tabelas alvo. A operação só foi considerada aprovada após postflight de existência, RLS, policies, grants e índices.

O provisionamento do primeiro Admin permanece uma unidade separada.

## V19.7V — Decisões — `e935a474f09f2466c7fda18678d2684084b4e1e3`

- Provisionar o primeiro Admin por mecanismo local one-time, nunca por senha versionada.
- Não aceitar senha por argumento de processo ou variável permanente.
- Não fazer escrita remota automática no gerador.
- Recusar bootstrap quando `admin_users` já possuir qualquer registro.
- Manter a credencial real fora de Git, documentação e chat.
- Somente executar o bootstrap real depois da reconciliação documental deste checkpoint.

## V19.7W — Decisão de provisionamento do primeiro Admin

Na base `2edd24c560becdcad58b730b010d4de0b43ebb16`, o primeiro Admin real foi provisionado somente após:
- schema Admin materializado e validado;
- bootstrap seguro versionado e testado;
- reconciliação documental da V19.7V;
- confirmação prévia de `admin_count = 0`.

O SQL temporário de bootstrap foi apagado imediatamente após a execução e não deve ser preservado ou compartilhado.

A existência do registro não encerra a autenticação: o login real deverá ser provado separadamente.

## V19.7X — Decisão de prova funcional real

Na base `85af4708f436f0533ed83edcf869ee915018cd25`, o login real foi provado localmente contra o Supabase antes de configurar o frontend/Vercel, separando a correção da autenticação da configuração de deploy.

## V19.7Y — Decisões — `40b1a8f6173d1597bbbc68ec2042454d674ffcab`

- Ligar o formulário `/admin` ao endpoint real antes de redesenhar a área administrativa.
- Manter o frontend sem `SUPABASE_URL` e sem `SUPABASE_SERVICE_ROLE_KEY`.
- Tratar falhas de autenticação com mensagem pública neutra.
- Não navegar para dashboard inexistente após login.
- Considerar o layout atual funcional, porém não aprovado visualmente.
- Preservar arquivamento de orçamentos como requisito futuro quando o módulo administrativo de orçamentos for implementado.

## V19.7Z — Decisões — `145345bcd55a7720adaa79167b67dca0299a67dc`

- Restaurar sessão administrativa por verificação server-side, nunca por armazenamento de token no frontend.
- Manter o cookie `rf_admin_session` HttpOnly.
- Tratar `GET /api/admin-session` como endpoint read-only de estado de autenticação.
- Falhar fechado para sessão ausente, inválida ou expirada.
- Não criar dashboard administrativo falso nesta unidade; a superfície de gestão vem depois da prova de sessão restaurada no navegador.

## V19.7ZA — Decisões — `ccf21c72b88af85cab27828a917d5cddeea7daf5`

- Adotar `Path=/` para o cookie administrativo porque `/admin` e `/api/admin-*` precisam compartilhar a mesma sessão e não possuem um prefixo comum mais restrito.
- Compensar o escopo de path com as proteções existentes: HttpOnly, SameSite=Lax, Secure em produção, token opaco, autorização server-side e proteção de origin nas mutações.
- Não considerar a restauração concluída até um novo login em Preview emitir o cookie atualizado e sobreviver a `Ctrl+R`.

## V19.7ZA — Decisão após prova real

A restauração de sessão administrativa foi aprovada em navegador real.

A próxima unidade funcional deve iniciar a área administrativa autenticada de Orçamentos, reutilizando:
- sessão Admin já validada;
- read models já existentes;
- persistência real;
- histórico da jornada sem recalcular snapshots.

Arquivamento reversível permanece como requisito funcional da futura listagem administrativa.

## 2026-08-26 — Fechamento V19.8A–V19.8C

### D — Admin é ambiente de trabalho persistente

A área `/admin` deixa de ser tratada como simples tela de login e passa a ser o ambiente principal de trabalho administrativo. A usuária pode navegar para o Planning para simular/criar orçamento e retornar ao Admin sem perder o contexto administrativo.

### D — Identidade visual consolidada

Fica aprovada e congelada, para Admin e Planning administrativo, a identidade:
- marrom escuro como cor principal;
- creme/papel como base;
- dourado como destaque;
- abandono do vinho antigo como cor dominante.

Mudanças futuras devem preservar essa direção salvo decisão explícita posterior.

### D — Restauração de sessão não deve exibir formulário antes da resposta server-side

Enquanto `GET /api/admin-session` estiver em andamento, a interface deve mostrar estado neutro de verificação. O formulário de login só deve aparecer quando o servidor confirmar ausência de sessão válida.

### D — Planning em modo administrativo deve oferecer retorno explícito

Quando aberto com `?admin=1&return=/admin`, o Planning deve indicar “Modo administrativo” e oferecer “Voltar ao Admin”. O destino de retorno deve ser restrito a caminho interno.

### D — Proteção Vercel Preview é separada da autenticação Roda Festa

A tela “Log in to Vercel” em celular pertence à proteção do deployment Preview e ocorre antes do carregamento da aplicação. Não deve ser contornada com alterações inseguras no login Admin do Roda Festa.

### D — Histórico alimenta análise, não aprendizado automático

Orçamentos reais devem preservar sugestão, alterações e validação final para futura calibração. Nenhum dado histórico altera automaticamente o motor em produção.
