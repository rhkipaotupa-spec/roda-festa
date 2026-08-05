# Roda Festa Planner — Contexto de Continuidade (V11.0)

> Arquivo de referência para retomar o projeto sem perder decisões, regras e próximos passos.

## 1. Visão do produto

O projeto deixou de ser um simples simulador de orçamento.

A visão atual é:

**Construir um consultor digital da Roda Festa.**

O cliente deve sentir que:
- está sendo guiado por uma especialista em eventos;
- o sistema entendeu o evento antes do atendimento humano;
- a recomendação foi pensada com base em capacidade, tempo, estrutura e experiência;
- ele pode personalizar a proposta sem perder contexto;
- a cena visual reage ao planejamento.

Frase-guia:

> O cliente não preenche um formulário. Ele planeja a festa em um livro interativo enquanto vê o evento ganhar vida ao lado.

---

## 2. Estado atual aprovado

Versão atual:

**V11.0 — Identity Pass**

Pacote mais recente usado:

`planning-book-v11.0.zip`

Diretório substituído no projeto:

```text
src/planner/planning-book/
```

A V11.0 foi aprovada visualmente.

### O que está aprovado e não deve ser alterado sem motivo

- identidade visual do livro;
- fundo escuro da aplicação;
- estrutura de três áreas:
  - página 1 do livro;
  - página 2 do livro;
  - Cena Viva à direita;
- botão principal marrom;
- botões operacionais em marrom escuro;
- botões de conteúdo em marrom mais claro;
- cards do resumo do evento;
- card de investimento;
- progress bar;
- suspense com checks;
- navegação entre recomendação, estação e personalização;
- lógica básica de adicionar categorias;
- Cena Viva atual;
- assinatura discreta da aplicação fora do livro.

---

## 3. Filosofia de marca e layout

### Livro

O livro representa o cliente e o planejamento.

Por isso:

- não colocar logo grande dentro do livro;
- evitar propaganda dentro das páginas;
- o livro deve permanecer elegante, editorial e limpo;
- os detalhes devem aparecer no livro;
- a vitrine deve apenas encantar visualmente.

### Marca

A marca pertence à aplicação, não ao conteúdo do livro.

A assinatura aprovada da V11.0 é:

```text
RODA FESTA | Planejamento inteligente para eventos
```

Ela deve permanecer fora do livro.

Também foi aprovado manter uma presença discreta da marca no fundo escuro da tela inicial.

### Roda

A roda é o símbolo de processamento do Planner.

Usar a roda:
- em loading;
- nos checks;
- em microanimações;
- como símbolo do sistema pensando.

Não usar a roda como propaganda.

---

## 4. Fluxo do cliente aprovado

### Etapa 1 — Briefing

Cliente informa:
- nome;
- telefone;
- data;
- tipo do evento;
- adultos;
- crianças;
- duração;
- opcionais.

Botão principal:

**Gerar recomendação Roda Festa para meu evento**

### Etapa 2 — Suspense

A página 2 mostra os checks.

A página 1 não deve ser preenchida antes do término da análise.

Durante o suspense:
- não mostrar botões de voltar/refazer;
- não mostrar a recomendação;
- usar a roda;
- cada check deve ter tempo suficiente para parecer uma análise real;
- os checks devem aparecer diretamente na folha, sem card artificial atrás.

### Etapa 3 — Resumo

Quando o suspense termina:
- a página 1 recebe o resumo;
- a página 2 continua vazia;
- aparece o botão grande:

**Conhecer minha recomendação**

O botão deve ficar:
- em largura total;
- próximo ao card “Seu planejamento está salvo”;
- acima da progress bar.

### Etapa 4 — Recomendação

Ao clicar no botão:
- o botão desaparece;
- a progress bar permanece;
- somente a etapa “Recomendação” fica marrom;
- a página 1 não pode mexer;
- os botões superiores não podem mudar de posição;
- nenhuma barra de rolagem desnecessária deve surgir;
- a atenção deve ir para a página 2.

### Etapa 5 — Estações

Na recomendação:
- mostrar estrutura;
- mostrar carrinhos;
- mostrar estações;
- permitir abrir detalhes;
- permitir personalizar.

### Etapa 6 — Personalização

A personalização deve reutilizar o mesmo layout visual da página de detalhes da estação.

Não criar outro layout diferente.

---

## 5. Regras operacionais do motor

### Limite

Capacidade máxima atual:

- até 100 adultos;
- até 100 crianças;
- máximo de 3 carrinhos.

### Carrinhos

Regras:

- frituras usam um carrinho;
- mini lanches ou tortas usam outro carrinho;
- bebidas usam carrinho exclusivo;
- doces e bolo não usam carrinho;
- doces e bolo também não incluem mesa da Roda Festa;
- o cliente disponibiliza mesa, aparador ou estrutura para exposição.

### Compartilhamento

Frituras e mini lanches **não compartilham carrinho**.

Motivo interno:
- os equipamentos não cabem no mesmo carrinho;
- operação e montagem são diferentes.

Essa justificativa não deve ser mostrada ao cliente.

### Eventos pequenos

Para eventos abaixo de aproximadamente 15 convidados equivalentes:

- priorizar somente petiscos na recomendação inicial;
- não recomendar dois carrinhos automaticamente;
- não incluir mini lanches por padrão;
- o cliente poderá adicionar mini lanches depois;
- ao adicionar mini lanches, o motor deve incluir um carrinho exclusivo;
- bebidas continuam ocupando carrinho exclusivo;
- doces e bolo continuam sem carrinho.

### Quantidades

Evitar recomendações absurdas para eventos pequenos.

Exemplo:
- 3 pessoas não podem receber recomendação de 70 salgados;
- trabalhar com lotes mínimos, mas reduzir variedade;
- para reuniões pequenas, sugerir menos categorias;
- priorizar coerência por pessoa e otimização logística.

### Bebidas

Quando selecionadas:
- ocupam carrinho;
- aparecem como estação;
- mesmo sendo em consignação, exigem estrutura física própria;
- não ignorar o carrinho de bebidas na contagem total.

---

## 6. Linguagem ao cliente

Não usar linguagem interna como:

- convidados equivalentes;
- redução de deslocamento;
- otimização de estrutura;
- carrinhos duplicados;
- capacidade interna;
- regras logísticas;
- motivo técnico do compartilhamento;
- decisões de bastidor.

Usar linguagem consultiva.

Exemplo:

> Para o perfil do seu evento, recomendamos iniciar com uma estação de petiscos. Caso deseje ampliar o cardápio, você poderá acrescentar Mini Lanches, Bebidas, Doces ou Bolo na próxima etapa.

Trocar “Sugestão” por:

**Recomendação**

Sempre que possível.

---

## 7. Design System aprovado

### Botões

#### CTA principal
Marrom escuro.

Exemplos:
- Gerar recomendação;
- Conhecer minha recomendação;
- Solicitar orçamento;
- Continuar.

#### Navegação operacional
Marrom escuro, padrão consistente.

Exemplos:
- Editar informações;
- Refazer planejamento;
- Voltar.

Todos com:
- mesma altura;
- mesma largura quando estiverem em posição equivalente;
- fonte legível;
- alinhamento constante;
- posição fixa entre páginas.

#### Ações de conteúdo
Marrom mais claro.

Exemplos:
- Personalizar esta estação;
- Voltar aos detalhes da estação;
- Adicionar categoria.

### Cards

- um Hero Card;
- um padrão de Card de Estação;
- um padrão de Card de Resumo;
- não criar variações desnecessárias;
- reutilizar layouts já aprovados.

### Estrutura recomendada

Card principal marrom com:
- número à esquerda;
- “carrinho/carrinhos” abaixo;
- divisor vertical;
- explicação à direita.

Os cards de estações abaixo devem:
- ter a mesma altura;
- usar o mesmo eixo vertical;
- manter o divisor na mesma posição;
- parecer subordinados ao card principal.

### Tipografia

- títulos podem manter a fonte editorial;
- números devem ser legíveis;
- evitar fontes decorativas em métricas;
- botões precisam ter leitura confortável;
- não reduzir fonte apenas para fazer caber.

---

## 8. Pontos de UX que nunca devem regredir

- página 1 não pode tremer ao abrir recomendação;
- progress bar não pode sumir;
- botões superiores não podem mudar de posição;
- não criar scrollbar sem conteúdo;
- botão principal não pode ficar escondido abaixo da dobra;
- resumo deve caber sem rolagem;
- o cliente deve entender qual é o próximo passo;
- página 2 deve revelar informações gradualmente;
- a vitrine não deve receber cards, popups ou textos explicativos;
- detalhes ficam no livro;
- cena fica visual.

---

## 9. Próximo foco

Próxima sessão:

# Página da direita

Objetivo:

Transformar a recomendação em uma página consultiva, elegante e convincente.

### Trabalhar em:

- hierarquia da recomendação;
- linguagem consultiva;
- redução de espaços vazios;
- melhor apresentação das estações;
- melhor organização do card principal;
- explicação clara sem mostrar lógica interna;
- investimento somente após entendimento da estrutura;
- personalização natural;
- consistência dos cards;
- transição suave;
- integração futura com a Cena Viva.

### Não mexer ainda em:

- página 1 aprovada;
- identidade da aplicação;
- motor sem necessidade;
- assinatura da marca;
- Cena Viva, salvo ajuste necessário para conexão.

---

## 10. Próximas etapas do roadmap

### V11.1
Página da direita e recomendação consultiva.

### V11.2
Personalização das estações.

### V11.3
Cena Viva reagindo às alterações.

### V11.4
Resumo final e orçamento.

### V11.5
PDF, WhatsApp e compartilhamento.

---

## 11. Arquitetura criada

Estrutura existente:

```text
src/planner/planning-book/
├── PlanningBook.jsx
├── PlanningBook.css
├── useBookNavigation.js
├── book/
│   ├── Book.jsx
│   ├── BookHeader.jsx
│   ├── BookProgress.jsx
│   ├── BookFooter.jsx
│   ├── BookFlip.jsx
│   ├── Book.css
│   └── index.js
└── engine/
    ├── buildPlanningScene.js
    └── planningRules.js
```

Não voltar a concentrar tudo em um arquivo gigante.

Evoluir de forma modular.

---

## 12. Método de trabalho

Forma aprovada:

- cada sprint gera um ZIP;
- o ZIP contém a pasta `planning-book`;
- substituir a pasta inteira;
- manter changelog por versão;
- testar no navegador;
- enviar prints;
- preservar tudo o que já foi aprovado.

Nome sugerido para próximas versões:

```text
planning-book-v11.1.zip
planning-book-v11.2.zip
planning-book-v11.3.zip
```

---

## 13. Frases que resumem o produto

> Transformamos as informações do evento em uma recomendação clara, personalizada e visual.

> O cliente não preenche um formulário. Ele planeja a festa em um livro interativo.

> Toda informação detalhada mora no livro. Toda emoção mora na vitrine.

> O Planner deve parecer uma consultoria, não um cálculo.

---

## 14. Instrução para retomar

Ao voltar ao projeto, dizer:

> Vamos continuar o Roda Festa Planner a partir do V11.0. Leia `docs/RODA_FESTA_PLANNER_CONTEXT_V11.md` e foque agora exclusivamente na página da direita, preservando tudo que já está aprovado.

