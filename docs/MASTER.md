# SITE RODA-FESTA — Documento Mestre

## Identidade do projeto

O SITE RODA-FESTA é uma experiência digital de planejamento e orçamento de eventos para a Roda Festa.

Não deve parecer um formulário tradicional. Deve funcionar como uma experiência guiada, premium e acolhedora, em que o cliente sente que está sendo orientado por um consultor de eventos.

## Frase de produto

**Seu evento começa aqui.**

## Princípios

1. Encantar antes de pedir dados.
2. Explicar recomendações em linguagem humana.
3. Nunca fazer uma recomendação parecer apenas uma venda.
4. Mostrar segurança operacional sem inventar capacidade ou evidência inexistente.
5. Manter estética premium, escura, dourada, elegante e cinematográfica.
6. Priorizar textos em HTML/CSS; evitar textos incorporados em imagens quando qualidade e responsividade forem importantes.
7. Preservar histórico, snapshots e versões em vez de reescrever fatos antigos.
8. Tratar recomendação automática como ponto de partida editável, não imposição.
9. Servidor é autoridade de preço e integridade comercial.
10. Alterações aprovadas/congeladas só devem ser reabertas por feedback real ou necessidade funcional comprovada.

## Estado reconciliado — 04/09/2026

Baseline seguro de retomada:

`5292da7268b134f0a4b822e48c13623073f2da99`

Estado principal:

- Planning Book ativo em `/planning-book`;
- catálogo persistido carregado em runtime por `/api/product-catalog`;
- Admin autenticado em `/admin`;
- navegação Admin atual: **Orçamentos → Agenda → Produtos**;
- Archive / Trash / Restore implementados de forma reversível;
- edição administrativa de orçamento preservando histórico;
- catálogo com edição individual e em massa por categoria;
- Admin Commercial V1 aprovado/congelado até feedback real;
- motor autoritativo `RF-REC-2.1.0`;
- Disaster Recovery V1 concluído, incluindo backup lógico, restore real, política operacional e segunda cópia semanal criptografada/offsite;
- Security P1-P5 fechados conforme evidências de 03/09;
- `npm run test:security` faz parte do contrato de CI;
- `main` protegida por ruleset `Protect main` com PR e status `validate` obrigatórios;
- GitHub Actions usa checkout/setup-node v7 em Node 24.

## Welcome

**STATUS: APROVADA / CONGELADA — v1.0**

Características aprovadas:

- fundo `welcome-roda-festa-wide_clean.png`;
- identidade marrom escura e dourada;
- logo e iluminação central;
- textos renderizados por HTML/CSS;
- aro externo com brilho em movimento;
- roda menor no divisor, em marrom escuro sobre o botão claro;
- CTA apenas com o texto `COMEÇAR MEU PLANEJAMENTO`, sem seta;
- botão com microinteração discreta;
- transição com tela de preparação;
- duração da transição: 5 segundos;
- mensagem de transição: `Preparando sua experiência`;
- texto de apoio: `Montando os primeiros detalhes do seu evento...`;
- barra de progresso e pontos animados.

Regra: não reabrir refinamentos da Welcome sem motivo funcional real.

## Arquitetura funcional atual

A jornada principal do cliente segue o fluxo:

`Início → Evento → Cardápio → Ajustes → Validação → Conclusão`

A arquitetura atual inclui:

- seleção do tipo de evento;
- data e composição de convidados;
- seleção de cardápio por categoria;
- recomendação autoritativa RF-REC-2;
- ajustes manuais completos da recomendação;
- cálculo de carrinhos, equipe, serviços e investimento;
- Commercial Ledger como fonte financeira canônica;
- persistência server-side de PlanningSession;
- RecommendationSnapshot e FinalProposalSnapshot históricos;
- Admin com leitura da jornada, agenda, lifecycle e catálogo;
- revisão administrativa de proposta sem apagar a origem;
- PDF/proposta com investimento contratado, consignação e estimativa geral separados semanticamente.

## Motor autoritativo

Versões efetivas reconciliadas em 03/09/2026:

- recomendação: `RF-REC-2.1.0`;
- parâmetros: `RF-PARAM-2.0.0-r4-elicited-2026-08-29`;
- regras comerciais: `RF-COM-1.0.0`;
- price book: `RF-PRICE-2026-08-24`.

A promoção histórica de `RF-REC-2.0.0` em 29/08/2026 permanece verdadeira e não deve ser reescrita. A versão `2.1.0` é evolução posterior relacionada à integração do Brigadeiro no Tacho e à correção da sua quantidade por convidados reais.

Dados reais calibram versões candidatas; não alteram automaticamente o motor em Production.

## Modelo de convidados atual

- adultos: fator `1,0`;
- crianças de 7 anos ou mais: fator `1,0`;
- crianças de 0–6 anos: fator `0,35` para convidados equivalentes;
- contagem real de convidados continua preservada separadamente;
- preço-base contempla 4 horas;
- hora adicional é calculada segundo a estrutura/carrinhos cobrados.

A regra antiga de `1 criança = 0,5 adulto` é histórica e não representa o motor autoritativo atual.

## Brigadeiro no Tacho

Contrato atual:

- 80 g por pessoa real;
- R$ 12,00 por porção de 80 g;
- opções: Chocolate, Leite Ninho e Meio a Meio;
- Meio a Meio representa 40 g + 40 g por pessoa;
- capacidade por hora ainda não foi medida: `productionPerHour = null`;
- com bebidas, compartilha o carrinho de bebidas;
- sem bebidas, exige carrinho próprio;
- não compartilhar com frituras, mini lanches ou tortas.

Não inventar capacidade operacional para o Tacho.

## Catálogo e capacidade

O catálogo persistido alimenta o Planning Book em runtime. Alterações de preço, lote ou capacidade devem ser versionadas e não podem reprecificar propostas históricas automaticamente.

Existe um ponto de atenção não bloqueante: o cadastro de produto novo atualmente herda defaults de `productionPerHour` conforme a categoria, exceto Tacho. Esses defaults são valores históricos do catálogo-base e **não devem ser apresentados conceitualmente como nova medição operacional**. A proveniência/captura futura de capacidade deve ser tratada em unidade própria antes de qualquer mudança de comportamento.

## Admin

Estado aprovado/congelado:

- Orçamentos: Ativos / Arquivados / Lixeira;
- agrupamento por mês do evento;
- busca que abre grupos relevantes;
- Histórico;
- Editar orçamento quando aplicável;
- Agenda derivada de `planning_sessions`, sem tabela paralela;
- múltiplos eventos na mesma data = atenção operacional, não conflito presumido;
- Produtos agrupados por categoria;
- edição individual;
- edição em massa de preço, lote e capacidade;
- histórico/versionamento preservados;
- sem hard delete operacional nesta versão.

`Clientes` e `Aprendizados` permanecem futuros. Não criar módulo `Pedidos` enquanto não existir entidade/lifecycle operacional distinta do orçamento validado.

## Segurança e governança de entrega

Estado reconciliado do fechamento de 03/09/2026:

- P1 — sessão Admin revalida identidade atual por `userId`: **CLOSED**;
- P2 — `npm run test:security` como gate explícito antes da suíte completa: **CLOSED**;
- P3 — secret scan com Gitleaks: **CLOSED WITHIN EXECUTED COVERAGE**; TruffleHog não foi executado;
- P4 — dependências npm: **CLOSED**, audit completo e Production = 0 vulnerabilidades;
- P5 — Actions em Node 24: **CLOSED**;
- security tests = 110/110;
- full suite = 417/417;
- lint/build = GREEN;
- workflow `.github/workflows/admin-commercial-v1.yml` usa `actions/checkout@v7`, `actions/setup-node@v7`, Node 24 e job `validate`;
- ruleset `Protect main` id `22214695` ativo na default branch;
- bypass = nenhum / `current_user_can_bypass=never`;
- delete e force push/non-fast-forward bloqueados;
- Pull Request obrigatório;
- status check obrigatório = `validate`;
- approvals = 0 e strict up-to-date = off por decisão deliberada.

Não renomear `validate` sem atualizar a ruleset. Não burlar a proteção da `main` para acelerar uma entrega.

## Disaster Recovery

Estado atual: **CONCLUÍDO**.

Camadas comprovadas:

1. Git/GitHub para histórico de código e checkpoints;
2. Vercel para deployments e rollback;
3. backups físicos/restore do Supabase;
4. backup lógico independente com `pg_dump`, manifesto, SHA-256 e contagens;
5. restore real isolado em `roda_festa_restore_test`;
6. cópia semanal autenticadamente cifrada com AES-256-GCM;
7. cópia off-machine no Google Drive somente dos artefatos cifrados;
8. download da cópia offsite e verificação criptográfica contra os bytes recuperados.

Política V1:

- RPO = 24 horas;
- RTO = 4 horas;
- backup lógico diário;
- backup adicional antes/depois de migration ou intervenção relevante de dados;
- pelo menos 14 gerações diárias locais;
- uma cópia semanal cifrada/offsite;
- meta de 4 gerações semanais;
- restore drill mensal;
- PITR desligado no estágio atual;
- nenhuma retenção destrutiva automatizada sem unidade própria, testes e prova fail-closed.

Destino local padrão:

`D:\Backups\Roda-Festa\daily`

Staging semanal:

`D:\Backups\Roda-Festa\weekly`

Nenhum segredo, chave, token, senha, cookie, connection string privilegiada ou conteúdo de `.env*` deve ser registrado em Git ou documentação.

A última recovery proof comprovada permanece a de 02/09. O fechamento de 03/09 não comprovou nesta conversa um novo backup diário de 03/09; não marcar esse item GREEN sem evidência externa.

## Próxima direção

A prioridade volta a ser produto e operação real:

1. usar Production em casos reais;
2. coletar feedback da operação;
3. preservar casos reais confiáveis para teste cego do recomendador;
4. não recalibrar motor sem evidência suficiente;
5. evoluir Peak Capacity somente quando existirem dados reais de throughput, equipamento, equipe, duração e concorrência entre produtos;
6. manter documentação e snapshots reconciliados a cada novo checkpoint relevante.
