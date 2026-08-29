# HANDOFF — RODA FESTA

**Atualizado em:** 29/08/2026
**Status:** RF-REC-1.0.0 continua autoritativo em Produção; R3 congelada como shadow; R4 existe apenas como preflight de especificação testável.

## Checkpoint canônico

- branch: `main`
- commit técnico: `10310735535dd6ad1dc60208b5a6cef67f476db0`
- mensagem: `add RF-REC-2 R4 preflight checkpoint`
- gates: 14/14 focados; 342/342 suíte completa; lint GREEN; build GREEN.

## Estado do motor

### Produção

RF-REC-1.0.0 permanece intacto e autoritativo.

### R3

Shadow histórico congelado. Corrige buffer sólido duplicado e renormalização indevida de bebidas, mas não deve ser promovido.

### R4 preflight

Não é motor. Registra em código testável as decisões já fechadas:

- M, M*, Q, takeaway e sobra como conceitos separados;
- `S_presente = S_contratado ∪ S_externo`;
- B1 = Petiscos/Mini/Tortas; B2 = Doces/Bolos;
- `lambda_out = 0` identificado por ausência real de sobremesa;
- `lambda_in ~0,381860` provisório, não congelado;
- variedade saturante em Tortas/Bolos;
- gramaturas físicas e sigma derivados;
- takeaway de Bolos/Doces ainda pendente.

## Elicitação física atual

- fritos padrão: 23 g cru / 25 g pronto;
- pastel: 30 g cru / 34 g pronto;
- mini lanches: 115–125 g pronto;
- doces: 15–18 g/un.;
- mix prior Petiscos: Pastel 40%, Coxinha 40%, Bolinha 20%;
- `g_bar_Petiscos = 28,6 g`;
- `b_adulto` midpoint = 638,4 g;
- sigma midpoint: P .2912 / M .2820 / T .1096 / D .1292 / B .1880.

## Próxima prioridade

1. resposta final da consultoria;
2. takeaway de Bolos/Doces;
3. ficha de campo correta antes de 26/09;
4. invariantes e especificação R4 fechada;
5. replays pré-registrados;
6. implementação shadow somente depois.

## Não fazer

- não construir matriz cheia de substituição;
- não usar finais humanos como verdade de consumo;
- não multiplicar Tortas/Bolos linearmente pelo número de sabores;
- não confundir item não contratado com item ausente do evento;
- não esconder margem dentro de M;
- não transformar Mini 1,5 -> 2 em mera quantização por lote;
- não gerar snapshot com documentação ainda não reconciliada.
