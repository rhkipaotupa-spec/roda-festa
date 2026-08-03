# HANDOFF — SITE RODA-FESTA

**Atualizado em:** 03/08/2026  
**Status da sessão:** Planning Book aprovado visualmente; motor funcional; próxima frente é reconstruir a Cena Viva com direção de arte.

## 1. Estado atual

### Welcome

**STATUS: APROVADA / CONGELADA — v1.0**

- Não redesenhar sem motivo funcional real.
- Identidade escura, dourada, premium e cinematográfica.
- CTA: `COMEÇAR MEU PLANEJAMENTO`.
- Transição intermediária de 5 segundos.
- Insight futuro registrado: na saída da Welcome, representar um livro fechado que se abre e revela o Planning Book. Não implementar agora.

### Planning Book

**STATUS: LAYOUT APROVADO / FUNCIONAL EM EVOLUÇÃO**

A experiência foi definida como um livro de planejamento:

- página 1: cliente informa dados e escolhas;
- página 2: Roda Festa interpreta e recomenda;
- painel direito: materialização visual do evento;
- não deve parecer formulário tradicional;
- linguagem deve ser acolhedora, consultiva e não agressiva.

O layout atual foi aprovado:

- capa em couro marrom escuro;
- páginas com textura de papel grosso;
- encadernação discreta;
- página 1 e página 2 com funções diferentes;
- painel direito integrado ao EventScene existente;
- botão principal no rodapé da página 1;
- investimento no rodapé da página 2;
- conteúdo das páginas com rolagem independente.

## 2. Comportamento atual aprovado

### Página 1 — Meu Planejamento

Coleta:

- nome;
- telefone;
- data do evento;
- tipo de evento;
- adultos;
- crianças;
- duração;
- garçons;
- descartáveis;
- bebidas em consignação.

CTA definido:

`GERAR SUGESTÃO RODA FESTA PARA MEU EVENTO`

O botão deve permanecer visível no rodapé real da página 1.

### Página 2 — Nossa Sugestão

Não repetir os dados da página 1 como simples resumo.

A página 2 deve conter interpretação consultiva:

- saudação personalizada;
- introdução conforme o tipo de evento;
- estrutura recomendada;
- equipe recomendada;
- serviços selecionados;
- cardápio sugerido;
- quantidades e valores na próxima evolução;
- investimento inicial estimado sempre visível no rodapé;
- ação `Continuar planejando` sem apagar nome, telefone e data;
- futura ação `Personalizar cardápio`.

### Análise animada

Ao gerar a sugestão:

1. entender perfil do evento;
2. interpretar convidados;
3. dimensionar estrutura;
4. organizar equipe;
5. montar cardápio;
6. calcular investimento;
7. finalizar recomendação.

As etapas aparecem progressivamente para criar sensação de análise, sem depender de API externa.

## 3. Regras operacionais confirmadas

- Adulto = 1 convidado equivalente.
- Criança = 0,5 convidado equivalente.
- Serviço-base = 4 horas.
- Carrinho por 4 horas = R$ 300,00.
- Hora adicional por carrinho = R$ 150,00.
- Garçom = R$ 200,00.
- 1 garçom para cada 20 convidados reais, quando contratado.
- Cada carrinho inclui 1 profissional de preparo.
- Mini X-Burguer e Mini Hot Dog podem compartilhar carrinho.
- Petiscos de referência = R$ 1,50 por unidade.
- Brigadeiro = R$ 3,00 por unidade.
- Suco de laranja natural = 200 ml, R$ 6,00.
- Bebidas são opcionais, em consignação e cobradas conforme consumo.
- Preços devem permanecer centralizados e fáceis de editar.

## 4. Arquivos centrais atuais

```text
src/planner/planning-book/
├── PlanningBook.jsx
├── PlanningBook.css
└── engine/
    ├── planningRules.js
    └── buildPlanningScene.js

src/planner/scene/
├── Cart.jsx
├── DessertTable.jsx
├── EventScene.jsx
├── EventScene.css
├── SceneBackground.jsx
├── SceneFloor.jsx
├── SceneLayoutEngine.js
├── SceneRegistry.js
└── sceneAssets.js
```

## 5. Reaproveitamento confirmado

Já existem componentes visuais reaproveitáveis:

- carrinho real em PNG;
- produtos transparentes;
- mesa de doces;
- bolo;
- brigadeiros;
- composição de cena;
- catálogo e regras antigas;
- `EventScene` modular;
- `SceneLayoutEngine`;
- `framer-motion` instalado.

Não redesenhar carrinhos ou produtos em CSS enquanto houver ativos reais reaproveitáveis.

## 6. Problema visual atual da Cena Viva

A primeira integração da cena funcionou, porém ainda não foi aprovada.

Problemas identificados:

- cards permanentes sobre os carrinhos ficaram artificiais;
- alimentos ficaram pequenos;
- excesso de bandejas e repetições;
- alimentos pareceram flutuar;
- carrinhos e mesa de doces pareceram objetos soltos;
- falta hierarquia, profundidade e direção de arte;
- botão `Personalizar cardápio` não deve disputar atenção dentro da cena.

## 7. Direção de arte aprovada para a próxima sessão

A cena deve representar o evento, não apenas os carrinhos.

Regras:

1. No máximo 2 ou 3 produtos visíveis por carrinho.
2. Produtos maiores, apoiados sobre o balcão.
3. Não representar todas as unidades; representar categorias.
4. Remover cards permanentes dos carrinhos.
5. Informações detalhadas aparecem em tooltip ao passar o mouse.
6. Carrinhos em primeiro plano.
7. Mesa de doces em segundo plano.
8. Luzes, convidados e decoração em terceiro plano, suaves e desfocados.
9. Composição triangular, evitando objetos alinhados em uma única linha.
10. Infantil, casamento e corporativo devem receber atmosferas diferentes.
11. Futuramente considerar horário do evento para luz da tarde, golden hour ou noite.

## 8. Próxima implementação

Reescrever a Cena Viva como versão 2.0.

Arquitetura-alvo:

```text
PlanningBook
    ↓
buildPlanningScene
    ↓
SceneDirector
    ↓
SceneLayoutEngine
    ↓
EventScene
    ↓
Cart / DessertTable / Decor
```

### SceneDirector

Responsável por decidir:

- atmosfera;
- iluminação;
- decoração;
- produtos representativos;
- profundidade;
- hierarquia visual;
- entrada dos elementos.

### SceneLayoutEngine

Responsável por:

- posição;
- escala;
- camada/z-index;
- composição de 1, 2, 3 ou mais carrinhos;
- posição da mesa de doces;
- equilíbrio do palco.

### EventScene

Deve apenas renderizar o plano recebido, sem concentrar decisões de negócio ou direção de arte.

## 9. Não fazer na próxima sessão

- não redesenhar Welcome;
- não reabrir couro, papel ou encadernação;
- não adicionar mais elementos antes de organizar os existentes;
- não mostrar todas as unidades dos produtos;
- não criar cards permanentes sobre a cena;
- não reconstruir carrinhos já existentes;
- não misturar regra de cálculo com regra visual;
- não transformar o Planning Book em formulário comum.

## 10. Primeiro passo da próxima sessão

Criar, completos e validados:

1. `src/planner/scene/SceneDirector.js`;
2. `src/planner/scene/SceneLayoutEngine.js`;
3. depois ajustar `EventScene.jsx`, `Cart.jsx` e `EventScene.css` para consumir essa arquitetura.

Antes de substituir arquivos, criar uma branch ou commit de segurança.
