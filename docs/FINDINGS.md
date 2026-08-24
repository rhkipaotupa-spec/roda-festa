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
