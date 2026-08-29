# RF-REC-2 — R4 shadow executável

## Estado

Esta unidade implementa a R4 como **shadow executável não autoritativa**.

- RF-REC-1.0.0 continua autoritativo em Produção.
- R3 permanece congelada como evidência histórica.
- o preflight R4 de 29/08 permanece histórico e não é reescrito;
- nenhum caminho de PlanningBook, API, ledger, Admin, banco ou Produção importa `shadowRecommendationR4.js`.

## Dados físicos atualizados após o preflight

Repesagem pré-registrada:

- 10 Coxinhas prontas = 250 g => 25 g/un.;
- 10 Pastelzinhos prontos = 300 g => 30 g/un.;
- razão Pastel/Coxinha = 1,20;
- produção mecanizada, variação operacional declarada ~5%;
- gate pré-registrado: 1,20 ficou na zona cinzenta [1,08; 1,28].

Consequência: `kappa_P` não é congelado. O shadow usa provisoriamente âncora de contagem com corredor de massa como guarda, sem promover essa escolha a fato observado.

## Vetor de referência fixo

Mix de referência de Petiscos: 40% Pastel / 40% Coxinha / 20% Bolinha.

Com Pastel 30 g e Coxinha/Bolinha 25 g:

- `g_bar_P = 27 g`;
- Petiscos = 6,5 x 27 = 175,5 g/adulto;
- Mini = 1,5 x 120 = 180 g/adulto;
- Tortas = 70 g/adulto;
- Doces = 5 x 16,5 = 82,5 g/adulto;
- Bolos = 120 g/adulto;
- `b_adulto_ref = 628 g`.

Sigma estrutural fica fixo no mix de referência. A conversão Petiscos contagem->massa pode variar sem recalibrar substituição entre categorias.

## Substituição

- `lambda_out = 0` identificado por elicitação com ausência real de sobremesa;
- `lambda_in` central derivado do novo vetor: ~0,367449;
- sensibilidade obrigatória: `[0,35; 0,43]`;
- `S_presente = S_contratado U S_externo`;
- presença externa em B1 altera cobertura/substituição, mas não vira fornecimento da Roda Festa.

## Petiscos

Regra shadow provisória:

`q_P/E = clamp(6,5 ; 145/g_bar_P ; 235/g_bar_P)`

- tamanhos atuais 25–30 g permanecem ancorados em 6,5 unidades/pessoa no menu completo;
- extremos pequenos/grandes acionam guarda de massa;
- `kappa_P` segue de baixa confiança até consumo observado por SKU.

Somente Petiscos dentro de B1:

- esperado: 9/pessoa no mix de referência;
- planejado M*: 11/pessoa.

## M, M*, Q e takeaway

- Mini: M=1,5; M*=2 por pessoa;
- Torta: 1 sabor M=M*=70 g; 2+ sabores M=110 g, M*=140 g;
- Doces: M=M*=5 unidades;
- Bolo: 1 sabor 120 g; 2+ sabores 150 g;
- variedade satura em 2+ sabores;
- uplift total esperado por variedade é limitado a 15%;
- takeaway espontâneo é destino de sobra, não demanda;
- lembrancinha contratada é demanda separada por headcount e ainda não está implementada no orçamento de apetite.

## Limites desta unidade

- alocação por SKU de sólidos permanece diferida;
- pesos por SKU de todos os Petiscos ainda serão coletados;
- coleta real por SKU decidirá futuramente a leitura de `kappa_P`;
- capacidade de pico permanece diferida;
- promoção para Produção permanece diferida.

## Replays

O runner executa três casos técnicos anonimizados como fixtures de regressão. Eles não são usados como alvo de fitting e o motor não tenta reproduzir finais humanos.
