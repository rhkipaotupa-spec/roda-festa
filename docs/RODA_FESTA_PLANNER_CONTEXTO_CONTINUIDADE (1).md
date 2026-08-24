# RODA FESTA PLANNER — CONTEXTO DE CONTINUIDADE

## Estado atual

Projeto em fase final de polimento.

Versão-base mais recente enviada pela usuária:

`planning-book(1).zip`

Objetivo imediato no próximo chat:

- abrir o ZIP real do projeto;
- trabalhar diretamente nos arquivos existentes;
- mover a roda giratória da capa para abaixo do botão **“Iniciar meu Planejamento”**;
- preservar todo o restante da capa e do sistema;
- devolver a pasta `planning-book` completa, pronta para substituir no projeto.

## Produto

**Nome:** Roda Festa Planner

Planner digital de eventos com experiência visual em formato de livro/caderno premium.

Fluxo principal:

Home do site → Capa do Planner → Animação de abertura → Informações do evento → Recomendação → Personalização → Resumo → PDF → WhatsApp / especialista.

Não haverá pagamento online. Toda conversão comercial termina no WhatsApp.

## Identidade visual aprovada

- couro marrom escuro;
- tons creme e dourado;
- papel claro;
- visual elegante e sofisticado;
- sem aparência infantil;
- sem branco puro na marca;
- sem círculos ou efeitos extras atrás do logo;
- logo proporcional e discreto;
- roda giratória como assinatura visual do projeto.

## Capa — estado aprovado

Elementos aprovados:

- textura de couro;
- logo proporcional em tom creme/dourado;
- assinatura “Gastronomia que encanta”;
- título **Meu Planejamento**;
- frase **Toda grande festa começa com um bom planejamento.**
- campos Nome, Telefone e Data do evento;
- botão **Iniciar meu Planejamento**;
- validação obrigatória dos três campos;
- data retroativa bloqueada;
- telefone validado;
- animação de abertura do livro aprovada.

### Único ajuste pendente da capa

Mover a roda giratória.

Ordem desejada:

Logo  
↓  
Gastronomia que encanta  
↓  
Meu Planejamento  
↓  
Frase  
↓  
Nome  
↓  
Telefone  
↓  
Data  
↓  
Botão “Iniciar meu Planejamento”  
↓  
Roda giratória  
↓  
Rodapé

Não alterar mais nada nessa entrega.

## Regras de convidados

A interface deve separar:

- Adultos;
- Crianças até 6 anos;
- Crianças acima de 6 anos.

Para cálculo interno:

- adulto = 1 adulto equivalente;
- criança acima de 6 anos = 1 adulto equivalente;
- criança até 6 anos = 0,5 adulto equivalente.

O total real deve continuar separado da equivalência usada pelo motor.

Mesmos parâmetros de entrada devem sempre gerar exatamente a mesma recomendação e o mesmo valor. O motor deve ser determinístico.

## Motor e personalização

Já aprovados:

- recomendação automática;
- personalização por categoria;
- adicionar item;
- retirar item;
- alterar quantidade;
- adicionar categoria;
- retirar categoria;
- atualização automática do investimento;
- atualização automática da Cena Viva;
- retorno automático quando uma categoria fica sem itens.

Não alterar o motor sem solicitação explícita.

## Categorias

- Petiscos
- Mini Lanches
- Tortas
- Doces
- Bolos
- Bebidas

### Regras específicas

**Bebidas**
- sempre em consignação;
- não entram no investimento contratado;
- mostram apenas estimativa de consignação;
- quando não houver bebidas, manter no PDF espaço fixo com indicação de ausência de consignação.

**Bolos**
- cada incremento representa 120 g;
- resumo e PDF mostram o total em kg.

**Tortas**
- cada incremento representa 150 g.

**Doces e bolos**
- não ocupam carrinho;
- aparecem como itens entregues separadamente;
- mesa, aparador, montagem e exposição são responsabilidade do cliente.

## Cena Viva

Aprovada e congelada.

Usar somente:

- `car-frituras.png`
- `car-burger.png`
- `car-hot-dog.png`
- `car-burger-hot-dog.png`
- `car-drinks.png`
- `table-bolo.png`
- `table-doces.png`
- `table-bolo-doces.png`

Nunca voltar a montar alimentos por CSS.

## PDF

Já possui:

- capa;
- resumo do evento;
- estrutura;
- categorias;
- investimento;
- consignação;
- condições comerciais;
- contato.

Cuidados:

- logo pequeno e proporcional;
- evitar logo branco;
- manter layout fixo com ou sem bebidas;
- evitar rodapé isolado em nova página;
- manter tudo dentro da área segura do A4;
- usar um único modelo de PDF.

## Condições comerciais

- Validade: 5 dias
- Pagamento: Pix ou dinheiro
- Reserva: 50% na contratação
- Saldo: 50% até 24 horas antes do evento
- Consignação: cobrança em até 2 dias úteis após o evento
- Cancelamento em até 10 dias: cobrança de 50%
- Cancelamento em até 3 dias: cobrança integral
- Alteração de data em até 5 dias: taxa de 50%, sujeita à disponibilidade
- Atendimento apenas em Tupã
- Voltagem: 110V e 220V
- Fios, extensões e transformadores incluídos
- Cliente fornece a amperagem necessária
- Roda Festa não se responsabiliza por quedas de energia
- Alimentos não consumidos serão entregues aos anfitriões
- Contato: (14) 99896-0208
- Instagram: @rodafesta

## WhatsApp

Não haverá pagamento no site.

Objetivos:

- botão flutuante “Fale com a especialista”;
- mensagem pronta com resumo do planejamento;
- solicitar proposta oficial;
- especialista revisar;
- proposta oficial gerada após revisão humana.

## Próximos passos

1. Fechar definitivamente a capa.
2. Consolidar “Solicitar proposta oficial”.
3. Criar tela final de planejamento concluído.
4. Integrar WhatsApp com mensagem pronta.
5. Planejar a Central da Especialista / Planner Office.
6. Permitir revisão interna do planejamento.
7. Gerar proposta oficial revisada.
8. Futuramente transformar proposta aprovada em evento operacional.

## Regras de trabalho

- trabalhar sobre os arquivos reais enviados;
- não reconstruir versões antigas;
- não alterar telas aprovadas;
- fazer mudanças incrementais;
- entregar a pasta `planning-book` completa;
- evitar regressões;
- menos explicação e mais implementação;
- não gerar imagens quando a usuária pedir código;
- preservar integralmente o restante quando a solicitação for pontual.

## Primeira instrução do próximo chat

> Leia este documento e abra o ZIP real do projeto. Mova somente a roda giratória da capa para abaixo do botão “Iniciar meu Planejamento”. Preserve todo o restante e devolva a pasta `planning-book` completa e pronta para substituir.
