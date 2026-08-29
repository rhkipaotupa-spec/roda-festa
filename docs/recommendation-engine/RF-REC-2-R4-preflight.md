# RF-REC-2 — R4 preflight de especificacao (29/08/2026)

## Estado

Este checkpoint **nao implementa a R4**. Ele registra, em codigo testavel, as decisoes e medicoes ja fechadas enquanto a revisao da consultoria permanece aberta.

- RF-REC-1.0.0 permanece autoritativo.
- R3 permanece congelada como shadow historico.
- nenhum caminho de PlanningBook, API, ledger, Admin, banco ou Producao importa `shadowR4Preflight.js`.
- `lambda_in` e explicitamente provisoria e nao congelada.
- takeaway de Bolos/Doces permanece pendente.

## Separacao semantica

A R4 deve separar:

- `M_c`: consumo esperado medio;
- `M*_c`: planejamento conservador/seguranca quando houver evidencia operacional;
- `Q_c`: quantidade operacional apos lotes/quantizacao/alocacao;
- takeaway: demanda que sai com convidados, separada de consumo e sobra;
- sobra/retorno observado: evidencia de campo.

## Elicitacao atual

### Petiscos

- cardapio completo: 6-7/pessoa, midpoint 6,5, interpretado como consumo esperado;
- somente Petiscos dentro do bloco salgado: 8-10/pessoa, midpoint 9, consumo esperado;
- planejamento conservador nesse contexto: 10-12/pessoa, midpoint 11.

### Mini lanches

- consumo esperado: 1,5/pessoa;
- planejamento operacional declarado: 2/pessoa;
- isso nao e quantizacao por lote: para 60 pessoas, 90 ja e multiplo do lote 5, mas a operacao ainda levaria 120.

### Tortas

- 1 sabor: M=70 g/pessoa; M*=70 g/pessoa;
- 2+ sabores: M=110 g/pessoa no total da categoria; M*=140 g/pessoa;
- o efeito de variedade satura em 2+ e nunca multiplica linearmente pelo numero de sabores.

### Doces

- 5 unidades/pessoa como consumo esperado e planejamento atual;
- takeaway ainda nao elicitado.

### Bolos

- 1 sabor: 120 g/pessoa de consumo efetivo, aproximadamente um pedaco;
- 2+ sabores: 150 g/pessoa no total da categoria;
- sem margem adicional declarada;
- takeaway ainda nao elicitado.

## Pesos fisicos / operacionais

- fritos padrao: 23 g cru/congelado; 25 g pronto;
- pastel: 30 g cru/montado; 34 g pronto;
- mini lanches: 115-125 g prontos/unidade;
- doces: 15-18 g/unidade.

Prior operacional de mix de Petiscos preferidos:

- Pastel 40%;
- Coxinha 40%;
- Bolinha de queijo 20%.

Isso implica `g_bar_Petiscos = 28,6 g` como **prior operacional**, nao como frequencia ja medida em campo.

## Vetor de massa de referencia — midpoint atual

Usando mini 120 g e doce 16,5 g:

| Categoria | Massa esperada por adulto |
|---|---:|
| Petiscos | 185,9 g |
| Mini lanches | 180,0 g |
| Tortas, 1 sabor | 70,0 g |
| Doces | 82,5 g |
| Bolos, 1 sabor | 120,0 g |
| **b_adulto** | **638,4 g** |

Faixa fisica aproximada mantendo o prior de Petiscos e variando Mini/Doces nos intervalos medidos: ~623-653 g/adulto.

`σ_c` e derivado por definicao de `M_c / b_adulto`:

- Petiscos ~0,2912;
- Mini lanches ~0,2820;
- Tortas ~0,1096;
- Doces ~0,1292;
- Bolos ~0,1880.

O prior antigo de `σ` nao deve ser reutilizado na R4.

## Substituicao e presenca

`S_presente = S_contratado ∪ S_externo`.

A presenca externa de Mini lanches/Tortas e obrigatoria para o calculo do bloco B1, porque muda a cobertura interna. Se o cliente contrata somente Petiscos da Roda Festa mas serve Mini/Torta de fora, o motor nao pode aplicar o uplift de "somente Petiscos".

Q2-prime variou presenca de verdade: em evento com P+M+T e nenhuma sobremesa de fornecedor algum, Petiscos permanecem 6-7/pessoa. Portanto `lambda_out = 0` fica identificado pela elicitação atual.

Q1 foi confirmada com ausencia real de Mini/Torta externos. Com o vetor midpoint atual, `lambda_in ~= 0,38186`, mas permanece **provisoria e nao congelada** ate fechamento da consultoria e dados fisicos/observacionais suficientes.

## Variedade

Tortas e Bolos exibem uplift saturante de variedade:

- `h_T(1)=1`; `h_T(k>=2)=110/70`;
- `h_B(1)=1`; `h_B(k>=2)=150/120`.

Guarda de conservacao proposta: uplift total maximo declarado de 15%. A implementacao matematica completa fica para a R4, nao para este checkpoint.

## Pendencias bloqueantes antes da R4 autoritativa

1. resposta final da consultoria sobre este conjunto atualizado;
2. elicitar takeaway de Bolos e Doces;
3. revisar a ficha de campo antes de 26/09 para separar M, M*, Q, sobra e takeaway;
4. pre-registrar replays da R4 antes de comparar novamente com finais humanos;
5. somente depois implementar a R4 shadow executavel.
