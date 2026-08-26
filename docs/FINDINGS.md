# Roda Festa - FINDINGS

Registro técnico cumulativo do projeto. Este arquivo é a fonte documental para problemas, riscos, vulnerabilidades, regressões, melhorias e decisões de engenharia do Roda Festa Planner.

## Convenção

- **P0**: risco comercial, segurança ou integridade que pode causar prejuízo ou proposta incorreta.
- **P1**: risco relevante que deve ser tratado antes de ampliar uso/automação.
- **P2**: dívida técnica, manutenção, UX ou melhoria sem impacto crítico imediato.
- Estados: `ABERTO`, `EM TRATAMENTO`, `CORRIGIDO`, `ACEITO`, `MONITORAR`.

## Checkpoint de origem da V19

- **Branch:** `planner/v19-mobile-first`
- **Commit pré-V19:** `b7e99cd4151f7e902ffddd44506fc253a3f60bd4`
- **Mensagem:** `checkpoint: preserve planner pre-v19 state`
- **Working tree após o checkpoint:** limpa.
- **Função:** marco seguro e recuperável imediatamente anterior à substituição estrutural do Planner pela arquitetura V19 mobile-first.

---

## RF-001 - Divergência entre carrinhos exibidos e carrinhos cobrados

- **Severidade:** P0
- **Área:** Motor comercial / estrutura
- **Estado:** CORRIGIDO
- **Detectado em:** 2026-08-24
- **Evidência real:** proposta Maysa RF-260824-00001 exibiu 3 carrinhos, porém o investimento somava apenas 2 carrinhos (R$ 600,00 em vez de R$ 900,00).
- **Causa:** `calculateInvestment()` reconstruía a quantidade de carrinhos cobrados a partir dos itens e excluía o grupo de bebidas em consignação. A estrutura visual utilizava `calculateCarts().totalCarts`.
- **Correção:** `calculateInvestment()` passou a consumir o mesmo `totalCarts` produzido por `calculateCarts()`. Consignação exclui o valor da bebida do investimento inicial, não o preço da estrutura do carrinho.
- **Regra permanente:** uma única fonte de verdade para `totalCarts`; não recontar carrinhos em rotinas de preço, PDF ou UI.
- **Regressão mínima:** validar cenários de 1, 2 e 3 carrinhos e horas adicionais.

## RF-002 - Snapshot interno ainda não é persistência durável

- **Severidade:** P1
- **Área:** Proposta / continuidade operacional
- **Estado:** ABERTO
- **Detectado em:** 2026-08-24
- **Situação:** a V19 salva uma cópia no `localStorage` do navegador e tenta enviar a via interna por e-mail pela função `/api/planning-submissions`.
- **Risco:** `localStorage` é local ao dispositivo do cliente e e-mail não substitui banco de dados. Falha de rede/configuração pode deixar a equipe sem um registro central pesquisável.
- **Caminho recomendado:** criar persistência server-side do snapshot imutável antes da geração da proposta oficial, com ID/código único e histórico de status.
- **Regra futura:** PDF, e-mail/WhatsApp e painel interno devem derivar do mesmo snapshot persistido.

## RF-003 - API de proposta confia em valores calculados no cliente

- **Severidade:** P0
- **Área:** Integridade comercial / segurança
- **Estado:** ABERTO
- **Detectado em:** 2026-08-24
- **Situação:** `/api/planning-submissions` valida campos estruturais básicos, mas aceita `investmentTotal`, `unitPrice`, `estimatedValue`, quantidades e carrinhos enviados pelo navegador.
- **Risco:** um cliente tecnicamente capaz pode alterar o payload no navegador e enviar uma cópia interna com valores adulterados.
- **Caminho recomendado:** no servidor, validar/recalcular itens, preços, carrinhos, horas e total usando catálogo/versionamento de preço confiável. O cliente pode enviar escolhas, mas não deve ser autoridade do preço final.
- **Regra futura:** números financeiros oficiais nunca devem ser confiados exclusivamente ao frontend.

## RF-004 - Endpoint de envio pode ser abusado para spam/custo

- **Severidade:** P1
- **Área:** Segurança / disponibilidade / custo
- **Estado:** ABERTO
- **Detectado em:** 2026-08-24
- **Situação:** endpoint público aceita POST e dispara e-mail quando configurado.
- **Risco:** automação externa pode gerar volume de requisições, custos e ruído operacional.
- **Caminho recomendado:** rate limiting, validação mais rígida de origem/intenção, honeypot/anti-bot e limites por IP/sessão. Avaliar token de sessão do Planner para submissões.

## RF-005 - Múltiplas implementações históricas do Planner permanecem na árvore

- **Severidade:** P2
- **Área:** Arquitetura / manutenção
- **Estado:** ABERTO
- **Detectado em:** 2026-08-24
- **Situação:** coexistem `src/planner/planning-book`, `src/planner/scene/planning-book`, `stage`, `stage-v2`, sandboxes, arquivos `.bak` e CSS antigo.
- **Risco:** correção aplicada no arquivo errado, regras duplicadas divergirem, bundle/manutenção maiores e regressões silenciosas.
- **Caminho recomendado:** após a V19 estabilizar, mapear dependências reais, congelar o legado e remover/arquivar código morto em commit separado e reversível.
- **Regra:** não apagar legado durante a validação visual inicial da V19 sem evidência de não uso.

## RF-006 - Configuração de envio interno depende de ambiente de produção

- **Severidade:** P1
- **Área:** Deploy / operação
- **Estado:** ABERTO
- **Detectado em:** 2026-08-24
- **Situação:** a via interna exige `RESEND_API_KEY` e `RODA_FESTA_PROPOSAL_EMAIL`; `RODA_FESTA_FROM_EMAIL` é opcional.
- **Risco:** sem configuração correta, a experiência informa que apenas a cópia local foi preservada.
- **Caminho recomendado:** configurar variáveis na Vercel e criar smoke test pós-deploy sem expor chaves ou valores secretos em documentação, chat ou Git.

## RF-007 - Nova arquitetura mobile-first precisa de validação em dispositivo real

- **Severidade:** P1
- **Área:** UX / compatibilidade
- **Estado:** EM TRATAMENTO
- **Detectado em:** 2026-08-24
- **Situação:** V19 muda o Planner para uma etapa por tela, preservando o site institucional.
- **Risco:** teclado virtual, viewport, safe areas, scroll, pop-up de PDF e navegação de retorno podem se comportar de forma diferente em iOS/Android.
- **Validação mínima:** Chrome Android + Safari iPhone; viewport estreito; teclado aberto; rotação; voltar do navegador; bloqueio de pop-up; rede lenta.

## RF-008 - Protocolo inicial de snapshot dependia de PowerShell

- **Severidade:** P2
- **Área:** Governança / operação local
- **Estado:** CORRIGIDO
- **Detectado em:** 2026-08-24
- **Situação:** a primeira V19.1 trouxe `scripts/create-snapshot.ps1` e `npm run snapshot` chamando PowerShell.
- **Problema:** o padrão operacional definido para o projeto Roda Festa é CMD; depender de PowerShell cria atrito e quebra a convenção de execução do projeto.
- **Correção:** substituição por `scripts/create-snapshot.mjs`, executado por Node através de `npm run snapshot`, compatível com uso a partir do CMD.
- **Regra permanente:** instruções de terminal do projeto devem usar CMD, salvo solicitação explícita em contrário.

## RF-009 - Espelhamento `/MIR` tentou remover documentação histórica

- **Severidade:** P1
- **Área:** Migração / preservação documental
- **Estado:** CORRIGIDO
- **Detectado em:** 2026-08-24
- **Evidência:** ao espelhar a V19.1, arquivos históricos em `docs/` e `src/planner.zip` apareceram como extras e foram removidos da working tree.
- **Contenção:** os arquivos foram restaurados a partir do checkpoint `b7e99cd4151f7e902ffddd44506fc253a3f60bd4` antes de qualquer commit da V19.
- **Regra permanente:** migrações estruturais não devem apagar documentação histórica automaticamente; legado deve ser arquivado/removido apenas em commit específico, revisável e reversível.


## RF-010 - Dependências reportam 4 vulnerabilidades de alta severidade

- **Severidade:** P1
- **Área:** Dependências / segurança de supply chain
- **Estado:** ABERTO
- **Detectado em:** 2026-08-24
- **Evidência:** `npm ci` concluiu com 143 pacotes instalados e informou `4 high severity vulnerabilities`.
- **Evidência detalhada:** `npm audit` identificou `brace-expansion` (DoS por arrays intermediários sem limite), `nanoid < 3.3.18` (gerador customizado pode entrar em loop com tamanho zero) e `react-router 7.12.0–7.18.1` / `react-router-dom` (bypass CSRF em RSC Mode). O npm contabilizou 4 vulnerabilidades high no total.
- **Regra:** não executar `npm audit fix` ou `npm audit fix --force` de forma cega. Primeiro registrar o relatório, classificar explorabilidade no uso real do projeto e atualizar de forma controlada com build/lint/regressão após a mudança.

## RF-011 - Folha `src/styles/colors.css` vazia gera aviso no build

- **Severidade:** P2
- **Área:** Build / higiene técnica
- **Estado:** ABERTO
- **Detectado em:** 2026-08-24
- **Evidência:** build de produção concluiu com sucesso, mas o PostCSS informou que `src/styles/colors.css` está vazio e continua importado.
- **Risco:** não impede publicação, porém representa resíduo técnico e ruído de build.
- **Caminho recomendado:** confirmar se o arquivo está reservado pelo design system; se não estiver, remover o import/arquivo em uma limpeza específica sem tocar no visual aprovado.

## RF-012 - Baseline de lint encontrou 13 erros após a migração V19

- **Severidade:** P1
- **Área:** Qualidade / baseline técnico
- **Estado:** CORRIGIDO
- **Detectado em:** 2026-08-24
- **Evidência inicial:** `npm run lint` retornou 13 erros: ambiente Node não declarado na função Vercel, quatro ocorrências da regra `react-hooks/set-state-in-effect` em componentes legados, declarações não usadas no PlannerEngine/BookFooter, uma atribuição inicial inútil no novo PlanningBook e um parâmetro não usado em `calculateCarts`.
- **Estratégia V19.3:** declarar ambiente Node apenas para `api/` e `scripts/`; preservar o site institucional congelado desabilitando a regra nova de efeito somente nos quatro arquivos legados já existentes; remover declarações mortas sem efeito funcional; corrigir os dois avisos reais da V19.
- **Validação:** após aplicação correta da V19.3, `npm run build` concluiu com sucesso e `npm run lint` terminou com zero erros.
- **Critério permanente:** código novo do Planner/API deve manter lint verde; exceções de legado devem permanecer pontuais e documentadas.

## RF-013 - V19 perdeu identidade visual de caderno e punch da marca

- **Severidade:** P1
- **Área:** UX / identidade de marca
- **Estado:** EM TRATAMENTO
- **Detectado em:** 2026-08-24
- **Evidência:** QA visual da usuária mostrou header com logo sem contraste, páginas muito próximas de um formulário convencional e perda do caráter de Planner/caderno que existia nas versões anteriores.
- **Direção de correção V19.4:** manter a regra mobile-first de uma etapa por tela, mas recuperar capa vinho premium, header tipo capa/caderno, papel com textura e linhas discretas, dourado, profundidade, sombras e hierarquia editorial Roda Festa.
- **Regra:** simplificar navegação não significa simplificar a identidade; o Planner deve ser reconhecível como Roda Festa em cada etapa.

## RF-014 - Validação de campos obrigatórios não explica por que a navegação não avançou

- **Severidade:** P1
- **Área:** UX / validação
- **Estado:** CORRIGIDO NA V19.4 - PENDENTE QA
- **Detectado em:** 2026-08-24
- **Evidência:** ao clicar em “Escolher cardápio” sem data, a etapa não avançava, mas a causa podia ficar fora da área visível.
- **Correção:** criar aviso de validação em destaque no topo da etapa, usando a primeira pendência relevante, sem depender apenas do erro abaixo do campo.

## RF-015 - Acordeão de cardápio abria Mini Lanches sem critério

- **Severidade:** P2
- **Área:** UX / cardápio
- **Estado:** CORRIGIDO NA V19.4 - PENDENTE QA
- **Detectado em:** 2026-08-24
- **Evidência:** somente Mini Lanches iniciava expandido, enquanto as demais categorias começavam fechadas.
- **Correção:** todas as categorias passam a iniciar fechadas; a expansão ocorre apenas por ação da pessoa.

## RF-016 - Personalização completa da recomendação regrediu na V19

- **Severidade:** P0
- **Área:** Regra de negócio / UX / motor
- **Estado:** EM TRATAMENTO
- **Detectado em:** 2026-08-24
- **Evidência:** a V19 permitia apenas alterar quantidades dos itens sugeridos; desapareceram as capacidades já existentes de acrescentar item, trocar sabor, incluir categoria, retirar categoria e retirar item.
- **Impacto:** a recomendação deixava de ser um ponto de partida editável e passava a funcionar como cardápio quase fechado, contrariando a lógica comercial validada.
- **Correção V19.4:** a etapa Ajustes volta a permitir aumentar/reduzir quantidade, retirar item, trocar sabor, adicionar item da mesma categoria, retirar categoria inteira e adicionar categoria ausente, sempre recalculando estrutura e investimento pelo motor vigente.
- **Regra permanente:** recomendação nunca é imposição; cliente pode editar a festa completa dentro do catálogo e das regras operacionais disponíveis.

## RF-017 - Geração de PDF abriu `about:blank` sem conteúdo

- **Severidade:** P0
- **Área:** Proposta / PDF
- **Estado:** CORRIGIDO NA V19.4 - PENDENTE QA
- **Detectado em:** 2026-08-24
- **Evidência:** botão “Gerar meu PDF” abriu uma aba `about:blank` sem renderizar a proposta.
- **Causa provável:** uso de `window.open` com flags `noopener,noreferrer` e escrita posterior no `document` da nova janela gerou comportamento incompatível no navegador testado.
- **Correção:** gerar o HTML da proposta em `Blob`, abrir uma URL de objeto e manter a impressão automática dentro do documento, com mensagem explícita se o pop-up for bloqueado.
- **Regressão mínima:** Chrome desktop, Chrome Android e Safari iPhone com pop-ups permitidos/bloqueados.

## RF-018 - Tipografia editorial apresentou acentuação visual estranha

- **Severidade:** P2
- **Área:** UX / tipografia
- **Estado:** EM TRATAMENTO
- **Detectado em:** 2026-08-24
- **Evidência:** no título “O que você quer servir?”, o circunflexo de “você” apresentou aparência deslocada/estranha no QA visual.
- **Direção V19.4:** consolidar stack tipográfica local segura (`Georgia`, `Times New Roman`, serif) para títulos e stack de sistema para UI, reduzindo dependência de fontes inconsistentes e ajustando line-height/letter-spacing.

---

## Regras de governança do FINDINGS

1. Todo bug relevante encontrado recebe um ID antes ou junto da correção.
2. Findings P0/P1 devem registrar evidência, causa, correção/caminho e teste de regressão quando aplicável.
3. Mudanças de regra de negócio devem ser refletidas também em `DECISIONS.md`.
4. Antes de snapshot de fim do dia, reconciliar este arquivo com todos os checkpoints técnicos daquele dia.
5. Não gerar snapshot na janela entre uma correção técnica importante e sua reconciliação documental.

## RF-019 - Welcome V19/V19.4 perdeu a capa clássica aprovada

- **Severidade:** P1
- **Área:** UX / identidade de marca
- **Estado:** CORRIGIDO NA V19.5 - PENDENTE QA
- **Detectado em:** 2026-08-24
- **Evidência:** comparação visual em celular mostrou diferença gritante entre a capa histórica marrom-escura, com aparência de caderno premium, e a versão V19/V19.4 em vinho mais claro e composição simplificada.
- **Correção V19.5:** restaurar a linguagem da capa clássica: marrom muito escuro, lombada, molduras douradas, textura discreta, logo creme, título “Meu Planejamento”, campos de nome/telefone/data integrados à capa e botão dourado.
- **Regra:** o welcome é uma peça de marca, não apenas uma tela de entrada. Refatorações futuras não podem trocar sua linguagem visual sem validação explícita.

## RF-020 - Campo de data aceitava/retinha data anterior ao dia atual

- **Severidade:** P0
- **Área:** Regra de negócio / validação
- **Estado:** CORRIGIDO NA V19.5 - PENDENTE QA
- **Detectado em:** 2026-08-24
- **Evidência:** QA mobile exibiu data de evento anterior à data corrente.
- **Risco:** proposta pode ser criada para data impossível/expirada e contaminar planejamento, disponibilidade e atendimento comercial.
- **Correção V19.5:** manter `min=hoje`, rejeitar programaticamente qualquer valor menor que a data local corrente e limpar o campo, exibindo mensagem explícita.
- **Regressão mínima:** hoje deve ser aceito; ontem deve ser rejeitado; amanhã deve ser aceito; alteração manual inválida não pode persistir no estado.

## RF-021 - Controles de convidados quebram layout em viewport estreito

- **Severidade:** P0
- **Área:** Mobile / responsividade
- **Estado:** CORRIGIDO NA V19.5 - PENDENTE QA
- **Detectado em:** 2026-08-24
- **Evidência:** em celular, labels de Adultos/Crianças invadiram os controles +/- e textos ficaram empilhados/ilegíveis.
- **Causa:** combinação de `flex`, largura intrínseca do texto e grade fixa dos controles sem limites explícitos para viewport estreito.
- **Correção V19.5:** grade mobile `minmax(0,1fr) + controle fixo`, limites explícitos de largura, tipografia/line-height definidos e contenção horizontal em cards e telas.
- **Regressão mínima:** 320 px, 360 px, 390 px e 430 px sem overflow horizontal ou sobreposição.

## RF-022 - Via interna ainda não recebe o PDF canônico exato gerado ao cliente

- **Severidade:** P0
- **Área:** Proposta / rastreabilidade comercial
- **Estado:** ABERTO
- **Detectado em:** 2026-08-24
- **Requisito confirmado:** quando o cliente gerar o PDF, a Roda Festa deve receber e reter a mesma via documental.
- **Situação atual:** o fluxo registra/envia um snapshot estruturado antes da conclusão, mas não transmite os bytes do PDF efetivamente gerado/salvo pelo cliente.
- **Risco:** divergência entre documento visto pelo cliente e evidência interna, além de ausência de arquivo canônico para auditoria futura.
- **Direção obrigatória:** substituir o fluxo de impressão dependente do navegador por geração canônica controlada pelo sistema. O mesmo artefato deve ser entregue ao cliente e enviado/armazenado internamente a partir do mesmo snapshot imutável.
- **Critério de aceite:** hash/identificador da via interna deve corresponder ao artefato oferecido ao cliente; falha de armazenamento/envio interno deve ser visível e nunca silenciosa.

## RF-023 - Validação financeira completa ainda não foi homologada em todas as combinações

- **Severidade:** P0
- **Área:** Motor comercial / preço
- **Estado:** ABERTO
- **Detectado em:** 2026-08-24
- **Evidência verde parcial:** smoke confirmou 1 carrinho = R$ 300, 2 = R$ 600, 3 = R$ 900 e 3 carrinhos + 1 hora extra = R$ 450 de adicional.
- **Pendência:** ainda falta matriz completa envolvendo todas as categorias, troca/remoção/adição de itens, bebidas, garçons, descartáveis, durações e combinações de carrinhos.
- **Regra:** não considerar o Planner autoridade comercial autônoma enquanto essa matriz não estiver automatizada e verde.

## Checkpoint técnico V19.5 - 2026-08-24

- **Branch:** `planner/v19-mobile-first`
- **Commit técnico:** `46870b17f48c6dc36051971bf1a12267f4367d29`
- **Mensagem:** `feat: refactor planner v19 mobile-first and harden commercial flow`
- **Validação de build:** `npm run build` verde no Windows/Vite 8.1.5, com 123 módulos transformados; permanece apenas o aviso P2 já registrado em RF-011 sobre `src/styles/colors.css` vazio.
- **Validação de lint:** `npm run lint` verde, zero erros.
- **Smoke comercial crítico pós-V19.5:** 3 carrinhos = R$ 900,00; 1 hora adicional para 3 carrinhos = R$ 450,00; total do cenário testado = R$ 1.627,50.
- **Evidência anterior preservada:** 1 carrinho = R$ 300,00 e 2 carrinhos = R$ 600,00.
- **Escopo do checkpoint:** refatoração mobile-first V19, baseline técnico/lint, API de submissão, snapshot via Node/CMD, recuperação da personalização comercial V19.4, correções de PDF V19.4 e hardening visual/mobile V19.5.
- **Pendências P0 que permanecem abertas:** RF-003 (autoridade financeira no servidor), RF-016 (QA completo da personalização), RF-017 (QA real do PDF), RF-020/RF-021 (QA real de data e responsividade), RF-022 (PDF canônico idêntico para cliente e Roda Festa) e RF-023 (matriz financeira completa).
- **Regra de fechamento:** este checkpoint técnico só pode ser incluído em snapshot depois do commit documental que registra este hash e deixa a working tree limpa.

## RF-024 - Snapshot final não preservava adequadamente sugestão original e delta da cliente

- **Severidade:** P0
- **Área:** Histórico / recomendação / aprendizado
- **Estado:** CORRIGIDO PARCIALMENTE EM 25/08/2026
- **Detectado em:** 2026-08-25
- **Evidência:** o snapshot V19.5 gravava essencialmente o estado final da proposta. A recomendação inicial era substituída em memória conforme a cliente editava quantidades, itens e categorias.
- **Impacto:** sem a sugestão original e o delta até o final, a Roda Festa perde a principal evidência para calibrar o algoritmo com eventos reais.
- **Correção desta unidade:** o Planner passa a congelar `RecommendationSnapshot` quando gera a sugestão e a anexá-lo ao snapshot final, junto de `changesFromRecommendation` para inclusões, remoções e alterações de quantidade.
- **Limitação restante:** o delta ainda é derivado no fechamento e não substitui um event log server-side persistente com ator/motivo/timestamp.
- **Próxima evolução:** `PlanningSession` + `PlanningChange[]` duráveis no backend.

## RF-025 - Orçamento não possuía ledger canônico discriminado e reconciliável

- **Severidade:** P0
- **Área:** Integridade financeira / auditoria
- **Estado:** CORRIGIDO NA FUNDAÇÃO EM 25/08/2026
- **Detectado em:** 2026-08-25
- **Evidência:** o motor retornava totais agregados (`productsValue`, `cartsValue`, etc.), mas não existia uma lista canônica de linhas financeiras capaz de demonstrar cada componente do orçamento e provar que a soma fechava no total aprovado.
- **Risco:** inconsistências como o bug RF-001 podem passar despercebidas quando estrutura e preço são calculados/apresentados por caminhos diferentes.
- **Correção:** criado `commercialLedger.js`, com linhas de produto, carrinhos, horas adicionais, garçons e descartáveis; consignação fica em conjunto separado. O total contratado passa a ser derivado da soma das linhas.
- **Invariante:** `SUM(contractedLines.subtotal) === investment.total` e diferença de reconciliação deve ser `R$ 0,00`.
- **Uso futuro:** Admin exibirá exatamente esse ledger discriminado e bloqueará proposta inconsistente.

## RF-026 - Frontend ainda era autoridade prática dos números enviados à API

- **Severidade:** P0
- **Área:** Segurança / integridade comercial
- **Estado:** MITIGADO EM 25/08/2026 - PERSISTÊNCIA AINDA PENDENTE
- **Detectado em:** 2026-08-25
- **Relação:** aprofunda RF-003.
- **Evidência:** `/api/planning-submissions` aceitava `unitPrice`, `estimatedValue`, `investmentTotal` e `totalCarts` do navegador e os utilizava na via interna.
- **Correção desta unidade:** a API reconstrói produtos por ID usando catálogo confiável, recalcula convidados, carrinhos, garçons, descartáveis, ledger e total; preço unitário enviado pelo navegador é ignorado. Divergência de total/carrinhos, produto desconhecido ou quantidade fora de lote causa rejeição.
- **Limitação restante:** ainda não existe persistência durável nem controle anti-replay/rate limiting suficiente. O e-mail não é fonte de verdade de longo prazo.

## RF-027 - Não existe identidade durável de jornada para cliente sem login

- **Severidade:** P1
- **Área:** Sessão / histórico / continuidade
- **Estado:** ABERTO
- **Detectado em:** 2026-08-25
- **Situação:** `localStorage` e código local permitem continuidade limitada ao navegador, mas não oferecem identidade server-side confiável para rastrear uma jornada em múltiplas etapas/dispositivos.
- **Decisão:** cliente não terá login obrigatório. Será criada `PlanningSession` anônima no servidor, vinculável posteriormente a telefone/e-mail e recuperável no futuro por link mágico/código temporário.
- **Critério:** histórico comercial não pode depender apenas de storage do navegador.

## RF-028 - Admin futuro exige autenticação e autorização antes de exposição de dados

- **Severidade:** P0
- **Área:** Segurança / Admin
- **Estado:** ABERTO - GATE DE IMPLEMENTAÇÃO
- **Detectado em:** 2026-08-25
- **Situação:** a Central Admin terá clientes, agenda, preços, propostas, histórico e auditoria.
- **Regra:** `/admin` não pode ser protegido apenas por obscuridade de URL ou checagem client-side.
- **Requisitos mínimos:** autenticação, autorização server-side, sessão segura, proteção CSRF para mutações, auditoria de alterações de preço/proposta e princípio do menor privilégio.
- **Perfis planejados:** `OWNER`, `COMMERCIAL`, `OPERATION`; primeira fase pode usar apenas `OWNER`.

## RF-029 - Regressões comerciais dependiam de smokes manuais

- **Severidade:** P0
- **Área:** Qualidade / regras de negócio
- **Estado:** CORRIGIDO NA FUNDAÇÃO EM 25/08/2026
- **Detectado em:** 2026-08-25
- **Evidência:** RF-001 foi detectado pela conferência manual de uma proposta real. Os smokes posteriores eram comandos ad hoc no terminal.
- **Correção:** criada suíte automatizada com Node Test Runner cobrindo ledger, três grupos/carrinhos, consignação, hora adicional, garçons, descartáveis, histórico e validação comercial server-side.
- **Comandos:** `npm test` e `npm run test:commercial`.
- **Regra:** novo bug comercial relevante exige teste de regressão antes ou junto da correção.

## RF-030 - Ausência de versionamento explícito do recomendador, regras e tabela aplicada

- **Severidade:** P1
- **Área:** Rastreabilidade / histórico
- **Estado:** CORRIGIDO NA FUNDAÇÃO EM 25/08/2026
- **Detectado em:** 2026-08-25
- **Correção:** adicionadas versões explícitas `RF-REC-1.0.0`, `RF-COM-1.0.0` e `RF-PRICE-2026-08-24` ao motor e aos snapshots.
- **Regra:** proposta histórica deve registrar a versão efetivamente usada; nunca inferir a versão pela data nem recalcular histórico com regras atuais.

## Checkpoint técnico V19.6 - Fundação Comercial e Histórica

- **Data:** 2026-08-25
- **Branch:** `planner/v19-mobile-first`
- **Commit técnico:** `c0f69ec134a7a2d7d698241959274d4cb3ece071`
- **Mensagem:** `feat: add commercial ledger, history tracking and regression tests`
- **Validação oficial no Windows:** `npm test` com 11/11 testes verdes; `npm run lint` verde; `npm run build` verde com 125 módulos transformados.
- **Cobertura confirmada:** RF-001 em motor e recálculo server-side; consignação; horas adicionais; ledger; garçons; descartáveis; adulteração de preço/total; lote comercial; calendário de São Paulo; delta recomendação x final.
- **Invariante financeira protegida:** o ledger discriminado deve reconciliar em diferença zero com o total oficial; estrutura exibida e estrutura cobrada não podem divergir.
- **Autoridade comercial:** preço enviado pelo navegador não é aceito como verdade oficial; a API reconstrói o cálculo com catálogo confiável.
- **Limitações deliberadamente abertas:** PlanningSession e persistência server-side durável; event log persistente; PDF canônico idêntico cliente/Roda Festa; autenticação/autorizações do Admin; matriz comercial completa de todas as combinações; rate limiting/idempotência e demais hardenings.
- **Regra de governança:** este commit técnico deve ser seguido por commit documental que registre este hash antes de qualquer snapshot de fechamento.

## RF-031 - Limite de infraestrutura externa nao pode criar acoplamento com o Simplify

- **Severidade:** P0
- **Area:** Infraestrutura / isolamento entre produtos
- **Estado:** MITIGADO POR DECISAO ARQUITETURAL EM 25/08/2026
- **Detectado em:** 2026-08-25
- **Evidencia:** o projeto Supabase `Roda Festa` encontra-se pausado e a organizacao atingiu o limite de projetos gratuitos ativos. Os ambientes ativos pertencem ao Simplify, incluindo ambiente dedicado de runtime/security.
- **Risco:** pausar ou reaproveitar infraestrutura do Simplify para liberar capacidade do Roda Festa poderia reduzir isolamento de testes, disponibilidade ou seguranca do projeto prioritario.
- **Decisao:** nenhum ambiente do Simplify sera pausado, removido, reutilizado ou reconfigurado para viabilizar o Roda Festa.
- **Mitigacao:** a V19.7 foi repartida; a V19.7A implementa a abstracao de persistencia sem ativar banco remoto. A conexao duravel real sera promovida somente quando houver infraestrutura propria aprovada.
- **Regressao de processo:** pacotes de atualizacao nao podem executar migration automaticamente nem exigir secrets para aplicar uma fundacao ainda nao ativada.

## RF-032 - Acoplamento prematuro do dominio ao Supabase reduziria portabilidade e testabilidade

- **Severidade:** P1
- **Area:** Arquitetura / persistencia
- **Estado:** CORRIGIDO NA FUNDACAO V19.7A
- **Detectado em:** 2026-08-25
- **Situacao:** a primeira proposta da V19.7 pressupunha ativacao imediata de persistencia Supabase.
- **Risco:** dominio de sessao ficar condicionado a disponibilidade/configuracao de um fornecedor, dificultando testes isolados e futura migracao.
- **Correcao:** criado contrato de repositorio provider-agnostic com adapter em memoria para testes e adapter Supabase isolado.
- **Regra:** ausencia de configuracao de producao deve falhar alto; nunca usar memoria como fallback silencioso de producao.
- **Migration:** `infra/migrations/20260825_v19_7_planning_sessions.sql` esta versionada, mas deliberadamente nao aplicada.

## Checkpoint tecnico V19.7A - Abstracao de Persistencia de PlanningSession

- **Data:** 2026-08-25
- **Branch:** `planner/v19-mobile-first`
- **Commit tecnico:** `452be928190ad66b924a710f12d98d2b1a6f3964`
- **Mensagem:** `feat: add provider-agnostic planning session persistence foundation`
- **Validacao oficial no Windows:** `npm test` com 20/20 testes verdes; `npm run lint` verde; `npm run build` verde com 125 modulos transformados.
- **Aviso nao bloqueante preservado:** `src/styles/colors.css` continua vazio e importado, ja registrado em RF-011.
- **Cobertura nova:** contrato de adapter; idempotencia de criacao; preservacao da recomendacao original; ownership por `sessionId + tokenHash`; controle de versao/finalizacao; token anonimo de alta entropia; cookie HttpOnly/SameSite/Secure em producao; validacao de origem; adapter Supabase fail-high sem configuracao; service role restrita a request server-side e filtragem de posse.
- **Escopo deliberadamente NAO ativado:** banco remoto, migration, secrets, alteracao do fluxo atual da cliente e persistencia duravel de producao.
- **Estado da working tree apos commit tecnico:** limpa.
- **Proxima unidade:** integrar gradualmente o contrato de PlanningSession ao fluxo do Planner sem banco real, preservando comportamento atual e mantendo a ativacao de persistencia remota como gate separado.
- **Governanca:** este checkpoint tecnico deve ser seguido por commit documental que registre este hash antes de snapshot.

## RF-033 - Histórico de alterações precisava ser append-only e explicável

- **Severidade:** P1
- **Área:** Histórico / auditoria / PlanningSession
- **Estado:** CORRIGIDO NA FUNDAÇÃO V19.7C
- **Detectado em:** 2026-08-25
- **Situação:** até a V19.7B havia recomendação autoritativa e finalização controlada, mas ainda faltava uma timeline persistível de mudanças relevantes entre esses dois marcos.
- **Risco:** sem sequência append-only, uma futura área Admin poderia mostrar apenas estado inicial e final, sem explicar como a cliente chegou ao resultado.
- **Correção:** implementado `PlanningChange` em batch com ordenação, ator/timestamp server-side, ownership, controle otimista por versão e bloqueio após finalização.
- **Regra:** eventos históricos não são sobrescritos nem usados como autoridade financeira. Preço e total final continuam sendo reconstruídos pelo servidor.
- **Regressão:** testes cobrem ordem, append-only, ownership, tipo/produto inválido, conflito de versão e bloqueio pós-finalização.

## Checkpoint técnico V19.7C - PlanningChange Timeline

- **Data:** 2026-08-25
- **Branch:** `planner/v19-mobile-first`
- **Commit técnico:** `a9e6bf89e1e8799a0d9625a9e2731a624f4c447b`
- **Mensagem:** `feat: add append-only planning change timeline`
- **Validação oficial no Windows:** `npm test` com 38/38 testes verdes; `npm run lint` verde; `npm run build` verde com 126 módulos transformados.
- **Cobertura nova:** timeline normaliza ator/timestamp no servidor; rejeita tipo, produto e ownership inválidos; cliente envia batch com versão otimista; repository preserva ordem append-only; novas mudanças são bloqueadas após finalização.
- **Higiene pré-commit:** `git diff --cached --check` detectou uma linha em branco extra no EOF da migration; o arquivo foi normalizado sem mudança funcional e o check final ficou limpo.
- **Persistência remota:** continua DESLIGADA por padrão.
- **Migration:** permanece versionada e NÃO executada.
- **Estado da working tree após commit técnico:** limpa.
- **Próxima unidade:** reconstrução/consulta explicável da jornada para preparar o futuro Admin, ainda sem ativar banco remoto.

## V19.7D — Achados e regressões — `ce536b4ec42824eb904fdb4fcfb1353c4a2105eb`

### RED D1 — integração incompleta da leitura
A primeira validação preservou 41/41 testes, mas o lint encontrou dois problemas: referência fora de escopo no adapter em memória e import de leitura não utilizado na API. O achado mostrou que a função de leitura existia sem estar corretamente conectada ao endpoint. A correção removeu o caminho incorreto e integrou a ação `read` ao repository/API, acrescentando regressões de ownership e chamada same-origin.

### RED D2 — divergência entre shape persistido e shape normalizado
Após D1, a nova regressão falhou porque uma sessão com recomendação persistida era reconstruída como `STARTED`, e não `RECOMMENDED`. A causa foi a diferença entre campos persistidos em `snake_case` e os campos esperados em `camelCase`. O read model foi corrigido para compreender ambos os formatos e ganhou teste específico para impedir recorrência.

### GREEN final
A validação final encerrou com 44/44 testes aprovados, lint aprovado e build de produção aprovado. O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com esta unidade.

## V19.7E — Resultado de validação — `2852f946e2f9430afdc247f093ba2c421c035ecb`

A unidade foi aplicada sem modificar arquivos existentes: foram adicionados apenas o contrato `planning-admin-journey-query.js`, seu changelog e sua suíte específica de testes.

A validação passou diretamente em GREEN: 48/48 testes, lint aprovado e build de produção aprovado. O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

Não houve endpoint Admin, ativação de banco remoto ou execução de migration.

## V19.7F — Resultado de validação — `58bba0cb009d2823efa65d615fe9799990e74924`

A unidade adicionou exatamente três arquivos novos: `admin-authorization-boundary.js`, seu changelog e a suíte específica de testes.

A validação passou diretamente em GREEN:
- 55/55 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- nenhum endpoint Admin global criado;
- nenhum login real criado;
- nenhuma persistência remota ativada;
- nenhuma migration executada.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7G — Resultado de validação — `2e08ee32042de8cd5614091a49371975b7761c37`

A unidade adicionou exatamente três arquivos novos: `admin-authentication-contract.js`, seu changelog e a suíte específica de testes.

Validação:
- 63/63 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- principal deriva somente de sessão confiável resolvida no servidor;
- sessão expirada é rejeitada;
- cookie administrativo possui propriedades seguras por contrato;
- nenhum login real ou secret criado;
- nenhum endpoint Admin global criado;
- nenhum banco remoto ativado;
- nenhuma migration executada.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7H — Resultado de validação — `eb1713d82f937ceaf0dbe94f736336cff3a8e135`

A unidade adicionou quatro arquivos novos:
- `api/_lib/admin-session-repository.js`;
- `api/_lib/admin-session-adapters/memory.js`;
- changelog da V19.7H;
- suíte de testes do repository.

Validação:
- 72/72 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- token bruto não é persistido;
- sessão expirada deixa de autenticar;
- revogação invalida imediatamente;
- rotação invalida token anterior;
- adapter em memória é bloqueado em produção por padrão;
- nenhum login real ou secret criado;
- nenhum endpoint Admin global criado;
- nenhum banco remoto ativado;
- nenhuma migration executada.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7I — Resultado de validação — `b9b847c0ebf117451ae25a2aa2e1309ccd505d8c`

A unidade adicionou exatamente três arquivos novos:
- `api/_lib/admin-authentication-composition.js`;
- changelog da V19.7I;
- suíte de testes da composição.

Validação:
- 82/82 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- cookie opaco resolve sessão e alimenta a boundary;
- role/capabilities forjadas no cookie são ignoradas;
- ausência de cookie e token desconhecido falham fechados;
- revogação e expiração bloqueiam imediatamente;
- rotação invalida token anterior;
- capability ausente continua bloqueada;
- token bruto e tokenHash não são expostos;
- nenhum login visual, secret, endpoint Admin global, banco remoto ou migration foi criado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7J — Resultado de validação — `3334f7444650b2d93001e1f7d9bd75ec0251d0ef`

A unidade adicionou exatamente três arquivos novos:
- `api/_lib/admin-auth-http-boundary.js`;
- changelog da V19.7J;
- suíte de testes da boundary HTTP.

Validação:
- 92/92 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- Origin confiável coberto por testes;
- métodos diferentes de POST são rejeitados;
- credencial inválida não cria sessão;
- role/capabilities do cliente são ignoradas;
- logout revoga e limpa cookie;
- refresh rotaciona token e invalida o anterior;
- respostas não expõem token bruto, tokenHash ou credential;
- nenhum login visual, secret, endpoint Admin global, banco remoto ou migration foi criado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7K — Evidência e resultado — `5381ffc5de873781b6e976de53537b98190837ca`

A unidade criou a primeira experiência visual Admin.

Escopo técnico:
- `src/admin/AdminLogin.jsx`;
- `src/admin/AdminLogin.css`;
- atualização de `src/routes/AppRoutes.jsx`;
- changelog V19.7K;
- teste estrutural do shell Admin.

Evidências:
- 96/96 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- rota `/admin` preserva as rotas públicas;
- frontend não contém login real nem `fetch` de autenticação nesta unidade;
- não há credencial/secret fixo;
- shell possui características mobile-first e acessíveis;
- teste manual realizado em iPhone pela rede local com sucesso;
- preenchimento dos campos e ação `Entrar` produziram a mensagem prevista de indisponibilidade de credenciais reais.

Observação visual não bloqueante:
- placeholder `RF` não representa o branding final;
- logo oficial e refinamentos estéticos ficam para etapa futura.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7L — Resultado de validação — `4103e39b99b36bce9381a6d1a590a772cb90533d`

A unidade adicionou exatamente três arquivos novos:
- `api/_lib/admin-credential-verification.js`;
- changelog da V19.7L;
- suíte de testes do verifier de credenciais.

Validação:
- 106/106 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- `scrypt` e salt cobertos por testes;
- credencial correta/incorreta diferenciadas internamente sem expor detalhe ao chamador;
- usuário inexistente e senha incorreta retornam resultado neutro;
- conta inativa não autentica;
- identidade incompleta falha alto;
- role/capabilities vêm somente do registro confiável;
- hash, salt e credencial não aparecem no resultado autenticado;
- nenhum usuário/senha real, secret, endpoint novo, banco remoto ou migration foi criado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7M — Resultado de validação — `0b474af7a12871fa56dcd01a1da71056b0fa773e`

A unidade adicionou exatamente três arquivos novos:
- `api/_lib/admin-login-composition.js`;
- changelog da V19.7M;
- suíte de testes da composição de login.

Validação:
- 111/111 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- verifier server-side obrigatório;
- boundary HTTP obrigatória;
- request do cliente não consegue substituir o verifier confiável;
- resultado da boundary preservado sem exposição de dependências internas;
- nenhum usuário/senha real, secret, endpoint novo, `fetch` no frontend, banco remoto ou migration foi criado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7M1 — Incompatibilidade de composição identificada e corrigida — `7f43a827e5ead6e63d10022412e08130ddfb479b`

### FATO CONFIRMADO
A V19.7M utilizava em seus testes uma boundary falsa cuja interface permitia receber o verifier como segundo argumento de `login()`. A HTTP Boundary real recebe `credentialVerifier` na construção.

### Risco
Sem correção, o primeiro endpoint Admin poderia ser criado sobre uma integração apenas aparentemente compatível.

### Correção
- composição atualizada para construir a HTTP Boundary com o verifier confiável;
- testes unitários alinhados ao contrato real;
- teste de integração real adicionado.

### Evidência final
- integração real credencial → verifier → boundary → sessão → cookie: verde;
- credencial incorreta não cria sessão: verde;
- Origin não confiável é bloqueado antes da autenticação: verde;
- baseline acumulado: 114/114;
- lint: verde;
- build: verde.

Nenhum usuário/senha real, secret, endpoint novo, `fetch` no frontend, banco remoto ou migration foi criado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7N — Resultado de validação — `640100e906652d98c725ac1e9d13ba48842062ed`

A unidade adicionou exatamente três arquivos novos:
- `api/admin-login.js`;
- changelog da V19.7N;
- suíte de testes do endpoint HTTP.

Validação:
- 121/121 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- endpoint delega para a composição e transporta `Set-Cookie`;
- método inválido é convertido em 405 controlado;
- Origin não confiável recebe resposta pública neutra;
- credenciais inválidas não expõem diferenciação de usuário;
- erro interno inesperado não vaza mensagem, stack, token ou credencial;
- handler exige composição real durante o wiring;
- handler padrão permanece fail-closed em 503 enquanto o runtime real não estiver ligado.

Nenhum usuário/senha real, secret, `fetch` no frontend, banco remoto ou migration foi criado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7O — Roteamento Vercel da API preservado — `bbd9ddf422822890d296216e33b12223b606760f`

### FATO CONFIRMADO
O `vercel.json` anterior possuía apenas o fallback global `/(.*) -> /index.html`. Com a criação de `api/admin-login.js`, isso representava risco de o namespace `/api/*` ser interceptado pela SPA.

### Correção
- regra explícita `/api/(.*) -> /api/$1` adicionada antes do fallback;
- fallback SPA preservado;
- testes de regressão adicionados para ordem e isolamento;
- nenhuma configuração legada `builds` ou `routes` foi introduzida.

### Evidência final
- 124/124 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- namespace `/api/*` preservado;
- fallback SPA continua ativo depois da API;
- working tree limpa após o commit técnico.

Nenhum runtime real, usuário/senha real, secret, `fetch` no frontend, banco remoto ou migration foi criado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7P — Persistência Admin Supabase adicionada — `8db1e991f62329da29fc580ec79d5a776c9d241b`

### Entregue
- adapter de identidade para `admin_users`;
- adapter de sessão para `admin_sessions`;
- lookup por identificador normalizado;
- criação, lookup por token hash, revogação e rotação de sessão;
- uso server-side de `SUPABASE_SERVICE_ROLE_KEY`;
- ausência de persistência de token bruto;
- erros sanitizados.

### Evidência final
- 136/136 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- configuração ausente falha alto;
- service role permanece server-side;
- corpo upstream e secret não aparecem em mensagens de erro;
- nenhuma chamada remota real foi executada nos testes.

Nenhuma migration, tabela remota, usuário/senha real, hash real, secret, wiring do runtime ou `fetch` no frontend foi criado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7Q — Runtime Admin persistente composto — `ea839646658293301b812006dff7adc5a6438329`

### Entregue
- `api/_lib/admin-runtime.js`;
- composição explícita da cadeia Admin persistente;
- validação fail-high para ausência de Supabase;
- validação de `fetch` server-side;
- ausência de fallback para adapter de memória;
- objeto público sem env/service-role;
- teste ponta a ponta com adapters Supabase reais e transporte simulado.

### Evidência final
- 142/142 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- login ponta a ponta fecha com identity store + verifier + session adapter + repository + auth + login composition;
- token bruto não é persistido;
- service-role não aparece no objeto público do runtime.

O endpoint `api/admin-login.js` ainda permanece desligado do runtime.

Nenhuma migration, tabela remota, usuário/senha real, hash real, secret versionado ou `fetch` no frontend foi criado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7R — Endpoint ligado ao runtime persistente — `ff5f597dd40ed6f31a95d99d14c2cf3012dc026c`

### Entregue
- `api/admin-login.js` conectado ao `createAdminRuntime()`;
- runtime criado server-side;
- configuração/runtime indisponível retorna 503 neutro;
- runtime sem `loginComposition` também falha fechado;
- login válido preserva `Set-Cookie`;
- nenhum fallback de memória.

### Evidência final
- 147/147 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- wiring server-side de env/fetch comprovado;
- falha fechada sem exposição de detalhes internos;
- delegação ao login real e preservação do cookie aprovadas.

A infraestrutura HTTP está ligada ao runtime real, mas a operação permanece dependente da materialização/configuração segura da persistência Admin.

Nenhuma migration, tabela remota, usuário/senha real, hash real, secret versionado ou ligação do formulário visual foi criada.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7S — Contrato SQL Admin validado — `e969d23880aaf805c609255511b60b916aab5e67`

### Entregue
- contrato SQL em `supabase/admin/001_admin_persistence_contract.sql`;
- `admin_users` com identificador normalizado e único;
- material de verificação separado e sem senha bruta;
- `admin_sessions` com token hash único e sem token bruto;
- constraints temporais e de versionamento;
- índices necessários aos adapters;
- RLS habilitado;
- privilégios de `anon` e `authenticated` removidos;
- nenhuma policy aberta para clientes.

### Evidência final
- 154/154 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- contrato SQL coberto por testes estruturais;
- nenhuma execução remota realizada;
- nenhuma migration aplicada;
- nenhuma tabela remota criada;
- nenhum usuário/senha real;
- nenhum hash/salt real;
- nenhum secret versionado;
- runtime inalterado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7T — Barreira de materialização Admin validada — `5800452fbedf5a7bdf07d48e31500ba5feba2a12`

### Entregue
- `supabase/admin/002_admin_materialization_guard.sql`;
- checklist de materialização controlada;
- testes estruturais do preflight/postflight;
- regra de parada se tabelas já existirem;
- verificação de RLS, policies, grants e índices;
- garantia de ausência de comandos de mutação executáveis.

### Evidência final
- 161/161 testes aprovados;
- lint aprovado;
- build de produção aprovado;
- SQL guard permaneceu inalterado após correção do falso positivo;
- teste passou a remover comentários SQL antes de procurar comandos de mutação;
- nenhuma execução remota realizada;
- nenhuma Supabase CLI instalada;
- nenhuma migration aplicada;
- nenhuma tabela remota criada;
- nenhum usuário/senha real;
- nenhum secret versionado.

O aviso preexistente de `src/styles/colors.css` vazio permaneceu sem relação com a unidade.

## V19.7U — Materialização remota Admin comprovada

Preflight: ambas as tabelas Admin ausentes. Materialização do contrato V19.7S: sucesso. Postflight: `admin_users` e `admin_sessions` presentes; RLS ativo nas duas; zero policies; zero grants diretos para `anon`/`authenticated`; quatro índices obrigatórios presentes.

Nenhum primeiro Admin foi criado e nenhuma credencial ou secret foi documentado.

## V19.7V — Bootstrap seguro do primeiro Admin — `e935a474f09f2466c7fda18678d2684084b4e1e3`

Checkpoint técnico aprovado com 168/168 testes, lint e build verdes.

O mecanismo normaliza identidade, exige senha forte interativa, gera material de verificação com salt criptográfico, não grava senha bruta e produz SQL temporário one-time. Testes comprovam ausência de service-role, connection string e escrita remota.

Nenhuma credencial real foi criada ou inserida nesta unidade.
