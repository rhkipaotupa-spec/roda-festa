# Roda Festa - WORKLOG

## 2026-08-24

### Contexto recebido

- Base full do projeto recebida para revisão.
- Site institucional considerado aprovado e fora do foco de refatoração.
- Planner definido como foco principal.
- Regra operacional definida: instruções de terminal em CMD.
- Regra de edição definida: quando houver alteração manual de arquivo, entregar caminho completo e conteúdo completo; não usar patches ou pequenos acréscimos.

### Checkpoint pré-V19

- Branch criada: `planner/v19-mobile-first`.
- Commit seguro criado antes da substituição estrutural: `b7e99cd4151f7e902ffddd44506fc253a3f60bd4`.
- Mensagem: `checkpoint: preserve planner pre-v19 state`.
- Commit registrou o estado real acumulado do Planner pré-V19, inclusive changelogs históricos e a correção de carrinhos.
- Working tree confirmada limpa após o checkpoint.

### Migração V19

- V19.1 espelhada sobre o repositório preservando `.git`, `node_modules` e `dist`.
- O primeiro espelhamento com `/MIR` tentou remover documentos históricos e `src/planner.zip` por não existirem no pacote novo.
- Esses arquivos foram restaurados do checkpoint pré-V19 antes de qualquer commit da nova arquitetura.
- Confirmadas mudanças reais em `PlanningBook.jsx`, `PlanningBook.css` e `engine/planningRules.js`.
- `PlanningBook.css` foi reduzido de uma implementação histórica muito extensa para uma camada V19 significativamente mais enxuta, coerente com a nova experiência de uma etapa por tela.

### Mudanças V19

- Arquitetura do Planner migrada para mobile-first, uma etapa por tela.
- Atualização dos preços das porções/tortas de 150 g.
- Preservada a correção de cobrança de carrinhos da V18.1.
- Criado snapshot imutável no fluxo de conclusão.
- Criada tentativa de envio de via interna por `/api/planning-submissions`.
- Adicionada governança documental com FINDINGS, DECISIONS, ROADMAP, WORKLOG e protocolo de snapshot.
- Protocolo de snapshot migrado de PowerShell para Node, mantendo execução pelo CMD através de `npm run snapshot`.

### Pendências antes de publicar

- Instalar dependências a partir do `package-lock.json` vigente.
- Executar `npm run build`.
- Executar `npm run lint` e classificar eventuais erros entre legado e regressão V19.
- Executar smoke do motor comercial: 1, 2 e 3 carrinhos; horas adicionais; consignação; garçons; descartáveis.
- Testar jornada completa localmente.
- QA visual em celular real.
- Validar PDF contra o resumo exibido.
- Configurar de forma segura as variáveis de envio na Vercel.
- Tratar os findings P0/P1 antes de considerar o fluxo automatizado como autoridade comercial.

### Baseline técnico V19 - primeira execução local

- `npm ci`: concluído com sucesso; 143 pacotes instalados, 144 auditados.
- O npm reportou 4 vulnerabilidades de alta severidade; ainda pendente relatório detalhado antes de qualquer correção automática.
- `npm run build`: concluído com sucesso no Windows/Vite 8.1.5; 123 módulos transformados.
- Build emitiu aviso de `src/styles/colors.css` vazio, sem interromper a compilação.
- `npm run lint`: falhou com 13 erros.
- Os erros foram classificados entre configuração de ambiente Node, dívida legada do site/Planner antigo e dois ajustes reais da V19.
- Preparada V19.3 para estabelecer baseline de lint sem alterar comportamento visual do site institucional.
- Próxima validação: substituir os arquivos completos da V19.3 e executar novamente `npm run build`, `npm run lint` e `git status --short`.


### QA visual e funcional V19

- V19 aberta localmente e navegada em fluxo real.
- Feedback: navegação de uma etapa por tela foi considerada promissora, porém a identidade visual perdeu punch e o Planner passou a parecer formulário convencional.
- Header perdeu contraste/legibilidade da marca.
- Validação sem data não explicava claramente por que a pessoa não avançava.
- Cardápio iniciava apenas Mini Lanches expandido sem critério.
- Etapa Ajustes preservou imagem/estrutura visual aprovada, mas regrediu a regra de personalização completa da recomendação.
- Botão de PDF abriu `about:blank` sem conteúdo.
- Tipografia editorial apresentou acento circunflexo visualmente estranho em “você”.

### V19.4 preparada

- Reforçada identidade Roda Festa sem abandonar a arquitetura mobile-first.
- Header redesenhado como faixa/capa vinho com logo creme e identificação “Meu Planner”.
- Papel recebeu linhas discretas, profundidade e detalhes dourados para recuperar linguagem de caderno.
- Todas as categorias do cardápio passam a iniciar recolhidas.
- Aviso de validação destacado criado para campos obrigatórios.
- Personalização completa reintroduzida: quantidade, trocar sabor, retirar item, adicionar item, retirar categoria e adicionar categoria.
- PDF migrado para abertura via Blob URL em vez de escrita posterior em `about:blank`.
- Documentação atualizada com RF-013 a RF-018.
- Sintaxe JSX validada com `@babel/parser` no ambiente de geração. Build/lint final devem ser repetidos no Windows antes de commit.

### Baseline verde V19.4 no Windows

- `npm run build`: verde, 123 módulos transformados; permanece apenas aviso de `src/styles/colors.css` vazio.
- `npm run lint`: verde, zero erros.
- Smoke crítico do motor: 3 carrinhos = R$ 900; 1 hora adicional para 3 carrinhos = R$ 450; total do cenário testado = R$ 1.627,50.
- Smoke anterior também confirmou 1 carrinho = R$ 300 e 2 carrinhos = R$ 600.

### QA mobile adicional - 2026-08-24

- Welcome V19.4 reprovado visualmente por perda da referência clássica marrom-escura e sofisticada.
- Confirmado bug de data anterior ao dia atual.
- Confirmado bug grave de responsividade nos controles de convidados em viewport estreito.
- Lógica financeira completa ainda não homologada; apenas smoke parcial de carrinhos/horas está verde.
- Requisito reforçado: a mesma via PDF gerada ao cliente deve chegar à Roda Festa e ficar armazenada/rastreável.

### V19.5 preparada para QA

- Welcome restaurado para linguagem clássica premium, mantendo a navegação de uma etapa por tela.
- Nome, telefone e data voltam para a capa; a etapa Evento fica focada em ocasião, convidados e duração, reduzindo sensação de formulário repetido.
- Data anterior a hoje passa a ser rejeitada também na lógica, com mensagem explícita.
- Controles de convidados recebem hardening responsivo para telas estreitas.
- Header e títulos internos ganham mais presença marrom/dourada sem voltar ao livro aberto antigo.
- RF-022 registra como P0 que a via interna ainda precisa receber o PDF canônico exato, e não apenas o snapshot.

### Checkpoint técnico V19.5 - 2026-08-24

- Build de produção validado com sucesso após aplicação da V19.5.
- `npm run lint` validado com zero erros.
- Smoke crítico do motor comercial permaneceu verde no cenário de 3 carrinhos + 1 hora adicional: carrinhos = R$ 900,00; hora adicional = R$ 450,00; total do cenário = R$ 1.627,50.
- Commit técnico criado na branch `planner/v19-mobile-first`.
- Commit: `46870b17f48c6dc36051971bf1a12267f4367d29`.
- Mensagem: `feat: refactor planner v19 mobile-first and harden commercial flow`.
- O checkpoint inclui a refatoração V19 mobile-first, baseline de lint, API de submissão, infraestrutura de snapshot, recuperação da personalização comercial, correções de PDF V19.4 e hardening visual/mobile V19.5.
- Permanecem deliberadamente fora desse checkpoint técnico os documentos de governança e fechamento, que serão registrados em commit documental separado.
- Próxima ação de fechamento: commit documental, confirmação de working tree limpa e somente então `npm run snapshot`.
