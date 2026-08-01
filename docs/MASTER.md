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
4. Mostrar segurança operacional: capacidade, quantidade, tempo, filas e equilíbrio.
5. Manter estética premium, escura, dourada, elegante e cinematográfica.
6. Priorizar textos em HTML/CSS; evitar textos incorporados em imagens quando a qualidade e responsividade forem importantes.
7. Cada tela precisa manter o nível visual alcançado na Welcome.

## Status atual

### Welcome

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

Regra: não reabrir refinamentos da Welcome sem um motivo funcional real.

## Próxima frente

Evoluir a tela de seleção de evento e o planejador, mantendo o mesmo nível premium da Welcome.

## Arquitetura funcional já existente

- seleção do tipo de evento;
- seleção de perfil do planejamento;
- motor de cálculo (`PlannerEngine`);
- catálogo de itens e perfis;
- regras de quantidade;
- cena com carrinhos;
- estado inicial do planejador;
- rodapé de progresso.

## Modelo de convidados

- o cliente informa quantidade de adultos e crianças;
- para cálculo, 1 criança equivale a 0,5 adulto;
- o sistema considera início e término do evento;
- preço-base contempla 4 horas;
- hora adicional é calculada por carrinho.

## Capacidade e operação

- Mini X-Burguer e Mini Hot Dog podem compartilhar o mesmo carrinho;
- a recomendação deve considerar capacidade do carrinho, produção média, duração e número equivalente de convidados;
- o sistema deve explicar por que recomenda determinada quantidade de carrinhos.
