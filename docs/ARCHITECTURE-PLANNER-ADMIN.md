# Roda Festa - Arquitetura Planner, Admin e Inteligência Operacional

## 1. Objetivo

Construir uma plataforma comercial e operacional que seja simples para a cliente, rigorosa para a Roda Festa e capaz de aprender com eventos reais sem perder rastreabilidade.

A arquitetura deve responder, a qualquer momento:

1. o que a cliente informou;
2. o que o motor recomendou;
3. qual versão do motor e tabela de preços produziu essa recomendação;
4. o que foi alterado depois;
5. qual proposta foi aprovada;
6. como cada centavo do total foi formado;
7. qual PDF foi entregue à cliente e armazenado internamente;
8. qual foi o resultado real do evento;
9. qual evidência justifica futuras mudanças do algoritmo.

## 2. Princípios de arquitetura

### 2.1 Uma única verdade comercial

Nenhuma tela deve reconstruir preço por conta própria. O motor comercial produz um ledger financeiro canônico. Planner, Admin, e-mail, PDF e integrações apenas apresentam esse resultado.

Invariante principal:

`SUM(ledger.contractedLines.subtotal) === finalProposal.investmentTotal`

Invariantes complementares:

- `cartsValue === chargedTotalCarts * cartBasePrice`;
- consignação não integra o investimento contratado;
- carrinho necessário para consignação continua integrando a estrutura cobrada;
- horas adicionais usam exatamente a quantidade de carrinhos cobrados;
- preços oficiais são obtidos de catálogo confiável no servidor;
- proposta histórica nunca é recalculada com tabela futura.

### 2.2 Cliente sem login obrigatório

O Planner não deve exigir criação de senha para gerar uma proposta.

A identidade inicial será uma `PlanningSession` anônima criada pelo servidor e associada a um identificador seguro. Quando a cliente informar telefone/e-mail, a sessão pode ser vinculada ao contato.

Para retomada futura em outro dispositivo, a arquitetura deve permitir link mágico/código temporário, sem obrigar uma conta tradicional.

### 2.3 Admin sempre autenticado

A Central Roda Festa conterá dados pessoais, agenda, preços, histórico comercial e auditoria. Portanto, acesso administrativo exige autenticação e autorização server-side.

Perfis inicialmente previstos:

- `OWNER`: proprietárias; acesso total;
- `COMMERCIAL`: propostas, clientes e agenda;
- `OPERATION`: eventos confirmados e pós-evento, sem alteração irrestrita de preço.

A primeira implantação pode começar apenas com `OWNER`, sem comprometer a evolução futura.

### 2.4 Histórico imutável, não sobrescrita

A recomendação original nunca é substituída pela edição final. Cada etapa importante gera snapshot ou evento de negócio.

Fluxo conceitual:

`PlanningSession -> InputSnapshot -> RecommendationSnapshot -> PlanningChange[] -> FinalProposalSnapshot -> CanonicalPDF -> EventOutcome`

### 2.5 Aprendizado controlado

Dados históricos não alteram automaticamente o motor de produção.

Uma nova versão do recomendador deve:

1. ser criada como candidata;
2. ser executada contra eventos históricos;
3. comparar recomendação candidata, recomendação antiga, decisão final e resultado real;
4. ser revisada pela Roda Festa;
5. só então ser promovida.

## 3. Modelos de domínio planejados

### PlanningSession

Representa a jornada da cliente, mesmo sem login.

Campos essenciais:

- `id`;
- `createdAt` / `updatedAt`;
- `status`;
- `contactId` opcional;
- `anonymousSessionTokenHash`;
- `source`;
- `lastActivityAt`.

### InputSnapshot

- tipo de evento;
- data;
- convidados por faixa;
- duração;
- cardápio selecionado inicialmente;
- serviços opcionais.

### RecommendationSnapshot

- versão do algoritmo;
- versão das regras comerciais;
- versão da tabela de preços;
- entradas utilizadas;
- itens e quantidades sugeridos;
- estrutura sugerida;
- ledger sugerido;
- total sugerido;
- timestamp.

### PlanningChange

Registrar apenas alterações comercialmente relevantes, não cliques de interface.

Tipos previstos:

- `ITEM_QUANTITY_CHANGED`;
- `ITEM_ADDED`;
- `ITEM_REMOVED`;
- `ITEM_REPLACED`;
- `CATEGORY_ADDED`;
- `CATEGORY_REMOVED`;
- `GUEST_COUNT_CHANGED`;
- `DURATION_CHANGED`;
- `SERVICE_ADDED`;
- `SERVICE_REMOVED`;
- `ADMIN_ADJUSTMENT`.

Cada evento terá `actor`, `before`, `after`, `timestamp` e, quando aplicável, `reason`.

Atores:

- `CLIENT`;
- `ENGINE`;
- `ADMIN`;
- `SYSTEM`.

### CommercialLedger

Fonte discriminada do orçamento.

Cada linha terá:

- tipo;
- item/serviço;
- quantidade;
- preço unitário vigente;
- subtotal;
- versão de preço;
- indicação de consignação;
- metadados operacionais quando necessários.

Linhas típicas:

- produtos;
- carrinhos;
- horas adicionais;
- garçons;
- descartáveis;
- outros serviços futuros.

### FinalProposalSnapshot

Congela tudo que foi aprovado, inclusive ledger e versões. Nunca deve depender de recálculo futuro.

### CanonicalPDF

Artefato único produzido do `FinalProposalSnapshot`.

Deve armazenar:

- identificador;
- hash criptográfico;
- caminho/objeto persistido;
- versão do template;
- timestamp;
- vínculo com a proposta.

O mesmo arquivo é oferecido à cliente e retido pela Roda Festa.

### EventOutcome

Registro pós-evento para aprendizado.

Por item/categoria, quando houver evidência:

- quantidade contratada;
- quantidade efetivamente levada;
- sobra estimada;
- falta percebida;
- classificação `INSUFICIENTE`, `IDEAL`, `PEQUENA_SOBRA`, `SOBRA_ALTA`;
- observação da especialista.

## 4. Central Admin

### 4.1 Dashboard

- próximos eventos;
- propostas aguardando revisão;
- propostas com inconsistência;
- eventos sem pós-evento preenchido;
- alertas de integridade;
- versão atual do motor/tabela.

### 4.2 Agenda

- calendário/lista;
- cliente;
- data e horário;
- convidados;
- status;
- carrinhos/estrutura;
- valor;
- pendências;
- acesso rápido à ficha.

### 4.3 Ficha da cliente/evento

Quatro blocos de negócio:

1. entrada da cliente;
2. sugestão original;
3. alterações;
4. proposta final.

Após realização, quinto bloco: resultado real.

### 4.4 Reconciliação financeira

Visão interna obrigatória e discriminada:

| Componente | Quantidade | Unitário | Subtotal |
| --- | ---: | ---: | ---: |
| Produto A | ... | ... | ... |
| Produto B | ... | ... | ... |
| Carrinhos | ... | ... | ... |
| Horas adicionais | ... | ... | ... |
| Garçons | ... | ... | ... |
| Descartáveis | ... | ... | ... |
| **Total reconciliado** | | | **...** |
| **Total aprovado** | | | **...** |
| **Diferença** | | | **R$ 0,00** |

Uma proposta nova com diferença diferente de zero deve ser bloqueada e marcada como inconsistente.

### 4.5 Tabela comercial

Alteração fácil para proprietárias, mas versionada:

- produto/serviço;
- preço atual;
- unidade;
- vigência;
- histórico;
- autor da alteração;
- justificativa opcional.

Alterar preço nunca modifica proposta histórica.

### 4.6 Saúde do recomendador

No futuro:

- percentual aceito sem alteração;
- categorias mais aumentadas/reduzidas;
- itens mais adicionados/removidos;
- divergência média sugestão x final;
- pós-evento por categoria;
- comparação entre versões do motor.

## 5. Segurança

Antes do Admin público em produção:

- autenticação robusta;
- autorização server-side;
- sessão segura HttpOnly/Secure/SameSite;
- proteção CSRF nas mutações;
- rate limiting;
- validação server-side de todos os inputs;
- segredos somente no ambiente de deploy;
- auditoria de alterações de preço/proposta;
- persistência durável e backup;
- dados pessoais mínimos e retenção definida.

## 6. Estado técnico de 25/08/2026

A primeira fundação implementada nesta unidade adiciona:

- `CommercialLedger` canônico no motor atual;
- reconciliação automática de soma;
- versões explícitas de recomendação, regras comerciais e tabela de preços;
- preservação transitória da recomendação original no snapshot final;
- comparação recomendação x final;
- recalculo autoritativo no servidor antes do envio interno;
- rejeição de preço/total/carrinhos adulterados no payload;
- suíte automatizada de regressão comercial com Node Test Runner.

Ainda não implementado nesta unidade:

- banco de dados;
- PlanningSession server-side;
- autenticação Admin;
- UI Admin;
- PDF canônico binário;
- event log persistido;
- coleta pós-evento.

Esses itens permanecem nas próximas fases do ROADMAP e não devem ser simulados com `localStorage` como solução definitiva.
