# Roda Festa — RF-REC-2.0.0 alpha shadow R3 (pré-gramatura)

## Objetivo desta unidade

Manter a primeira versão executável do novo raciocínio de recomendação **sem alterar o RF-REC-1.0.0 em Produção**, incorporando duas decisões de calibração tomadas em 29/08/2026 após o primeiro replay real:

1. os baselines de sólidos informados pela operação já são **quantidades de planejamento conservadoras**, com uma leve gordura operacional embutida por julgamento; portanto o alpha não deve somar um segundo buffer automático de +10%;
2. quando apenas parte do mix de bebidas é escolhida, o alpha deve manter a **participação típica original** de cada bebida selecionada e considerar o restante como bebida externa/não coberta, em vez de renormalizar o mix.

A unidade continua deliberadamente pequena e reversível:

- altera somente o módulo sombra `shadowRecommendationV2.js`;
- atualiza os testes próprios do alpha;
- atualiza o runner comparativo V1 x V2;
- atualiza esta documentação;
- não modifica `planningRules.js`;
- não modifica `PlanningBook.jsx`;
- não modifica snapshots, API, ledger, Admin ou banco;
- não muda `RF-COM-1.0.0`;
- não promove RF-REC-2 para Produção.

## Versões R3

- recommendation: `RF-REC-2.0.0-alpha-shadow-pregram-r3`
- parameters: `RF-PARAM-2.0.0-alpha-elicited-r3-2026-08-29`
- compatibility: `RF-COMPAT-1.0.0`
- commercial rules: `RF-COM-1.0.0`
- price book: `RF-PRICE-2026-08-24`

## Sólidos — semântica corrigida

A elicitação operacional de 29/08/2026 permanece:

- 0–3: fator de planejamento 0,35;
- 4–6: 0,35;
- 7–12: 1,00;
- 13–17: 1,00;
- adultos: 1,00;
- Petiscos em cardápio completo/4h: 6,5 un. por adulto-equivalente;
- Mini lanches: 2 un.;
- Tortas: 70 g;
- Doces/brigadeiros: 5 un.;
- Bolos: 120 g;
- sólidos: +10% por hora de 4h até 8h;
- lambda calculado pela elicitação 11 / 6,5 para Petiscos;
- theta = 0.

A correção R3 é semântica e quantitativa: esses valores são tratados como **alvos conservadores de planejamento**, não como consumo esperado puro. Assim:

- `solidBaselineSemantics = conservative-planning-target`;
- `additionalSolidServiceBuffer = 0`;
- não existe um segundo +10% automático sobre os sólidos.

Exemplos para 60 adultos / 4h:

- cardápio completo: Petiscos 390 un.; Mini lanches 120 un.; Tortas 4,2 kg; Doces 300 un.; Bolos 7,2 kg;
- somente Petiscos: 660 un. planejadas, equivalentes a 11 por pessoa.

A observação futura de consumo real e sobra real continua necessária para separar cientificamente consumo esperado e margem de segurança. O alpha não inventa essa decomposição antes dos dados de campo.

## Ponte matemática antes da gramatura

Ainda não existe `g_i` medido para Petiscos, Mini lanches e Doces. Por isso esta unidade **não finge massa onde ainda não existe medição**.

Ela usa a quantidade natural de cada categoria como baseline do cardápio completo e aplica o multiplicador de substituição:

`multiplicador = (soma dos pesos das categorias selecionadas)^(-lambda)`

Pesos provisórios:

- Petiscos 0,32;
- Mini lanches 0,20;
- Tortas 0,20;
- Doces 0,12;
- Bolos 0,16.

Quando todas as categorias estão selecionadas, a soma é 1 e o baseline conservador permanece intacto.
Quando apenas Petiscos está selecionado, o multiplicador reproduz aproximadamente 11 salgadinhos por pessoa.

Isto continua sendo uma **ponte operacional pré-gramatura**, não a prova final de conservação em massa.

## Primeiro replay real e implicação para a calibração

O primeiro replay técnico preservado no sistema confirmou um cenário de 60 adultos / 4h com apenas Petiscos como sólidos e refrigerante como bebida Roda Festa:

- RF-REC-1.0.0 sugeriu 195 Petiscos = 3,25 por pessoa;
- a versão final humana foi ajustada para 600 Petiscos = 10 por pessoa;
- o alpha R3, usando a elicitação conservadora de 11 por pessoa, planeja 660 Petiscos.

Esse replay é evidência de comparação entre **recomendação original e quantidade contratada final**, não de consumo observado. Não deve ser usado como prova de que 10 unidades por pessoa foram efetivamente consumidas.

## Bebidas — mix típico sem renormalização

A referência de bebidas permanece:

- 175 ml por adulto-equivalente/hora;
- 700 ml por adulto-equivalente em 4h;
- mix típico: 40% água, 40% suco, 20% refrigerante;
- estoque logístico: +30% sobre a parcela Roda Festa efetivamente selecionada.

A R3 muda o comportamento de seleção:

- cada SKU selecionado mantém sua participação típica original;
- o mix **não é renormalizado** para preencher 100%;
- a parcela não selecionada vira `externalOrUncoveredExpectedMl`;
- o alpha entende que outras bebidas podem ser fornecidas fora da Roda Festa.

Exemplo para 60 adultos / 4h com somente refrigerante Roda Festa:

- referência total típica: 42 L;
- participação típica do refrigerante: 20%;
- cobertura esperada Roda Festa: 8,4 L;
- parcela externa/não coberta: 33,6 L;
- estoque de refrigerante a levar com +30%: 10,92 L.

Suco e refrigerante usam 200 ml por unidade porque isso está codificado no catálogo atual.
Água continua sem conversão para unidades porque o volume da garrafa ainda não foi confirmado.

## Compatibilidade de idade

O resultado continua carimbando `ageResolution`.

No modo `legacy3` atual, a projeção omega não altera numericamente o alpha porque:

- 0–3 e 4–6 usam o mesmo fator 0,35;
- 7–12 e 13–17 usam o mesmo fator 1,00.

Assim, o input histórico continua íntegro e não precisamos inventar a divisão interna das faixas para esta etapa.

## Como validar após aplicar no projeto local

```cmd
cd /d C:\Projetos\roda-festa
node --test tests\shadow-recommendation-v2.test.mjs
node scripts\run-shadow-recommendation-v2.mjs
npm test
npm run lint
npm run build
```

O primeiro comando valida o alpha isolado.
O segundo mostra V1 e V2 lado a lado, incluindo um replay-base real anonimizado.
Os três últimos são os gates do repositório.

## O que NÃO deve ser feito nesta unidade

- não substituir `generatePlanningSuggestion()`;
- não gravar o resultado sombra em `RecommendationSnapshot` oficial;
- não alterar o ledger comercial;
- não mudar descartáveis para `R`;
- não alocar SKUs sólidos via round-robin;
- não inventar gramaturas;
- não reinterpretar quantidade contratada como consumo observado;
- não promover o alpha para Produção.

## Próxima unidade após GREEN

Executar os replays dos demais casos reais disponíveis e registrar comparação entre:

- RF-REC-1.0.0 histórico;
- decisão humana final;
- RF-REC-2 alpha R3.

A calibração estrutural final continua dependente das gramaturas e da coleta pós-evento.
