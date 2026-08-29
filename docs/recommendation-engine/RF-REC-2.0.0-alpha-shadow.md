# Roda Festa — RF-REC-2.0.0 alpha shadow (pré-gramatura)

## Objetivo desta unidade

Criar a primeira versão executável do novo raciocínio de recomendação **sem alterar o RF-REC-1.0.0 em Produção**.

Esta unidade é deliberadamente pequena e reversível:

- adiciona um módulo novo `shadowRecommendationV2.js`;
- adiciona testes próprios;
- adiciona um runner de comparação V1 x V2;
- não modifica `planningRules.js`;
- não modifica `PlanningBook.jsx`;
- não modifica snapshots, API, ledger, Admin ou banco;
- não muda `RF-COM-1.0.0`.

## O que já funciona

O alpha usa a elicitação operacional de 29/08/2026:

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
- margem operacional de sólidos: +10%;
- bebidas: 175 ml por adulto-equivalente/hora;
- mix: 40% água, 40% suco, 20% refrigerante;
- estoque de bebidas: +30% sobre consumo esperado;
- lambda calculado pela elicitação 11 / 6,5 para Petiscos;
- theta = 0.

## Ponte matemática antes da gramatura

Ainda não existe `g_i` medido para Petiscos, Mini lanches e Doces. Por isso esta unidade **não finge massa onde ainda não existe medição**.

Ela usa a quantidade natural de cada categoria como baseline do cardápio completo e aplica o multiplicador de substituição da forma fechada:

`multiplicador = (soma dos pesos das categorias selecionadas)^(-lambda)`

Os pesos provisórios são:

- Petiscos 0,32;
- Mini lanches 0,20;
- Tortas 0,20;
- Doces 0,12;
- Bolos 0,16.

Quando todas as categorias estão selecionadas, a soma é 1 e o baseline elicited permanece intacto.
Quando apenas Petiscos está selecionado, o multiplicador reproduz aproximadamente 11 salgadinhos por pessoa, exatamente a elicitação usada para obter `lambda`.

Isto é uma **ponte operacional pré-gramatura**, não a prova final de conservação em massa. O resultado deixa isso explícito em `semanticStatus` e `deferred`.

## Compatibilidade de idade

O resultado sempre carimba `ageResolution`.

No modo `legacy3` atual, a projeção omega não altera numericamente o alpha porque:

- 0–3 e 4–6 usam o mesmo fator 0,35;
- 7–12 e 13–17 usam o mesmo fator 1,00.

Assim, o input histórico continua íntegro e não precisamos inventar a divisão interna das faixas para a primeira execução sombra.

## Bebidas

O alpha separa:

- `expectedConsumptionMl`: consumo esperado;
- `stockToTakeMl`: logística com +30%;
- vetores por SKU para consumo e estoque.

Suco e refrigerante usam 200 ml por unidade porque isso está codificado no catálogo atual.
Água permanece sem conversão para unidades porque o volume da garrafa ainda não está confirmado.

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
O segundo mostra V1 e V2 lado a lado em três cenários de demonstração.
Os três últimos são os gates do repositório.

## O que NÃO deve ser feito nesta unidade

- não substituir `generatePlanningSuggestion()`;
- não gravar o resultado sombra em `RecommendationSnapshot` oficial;
- não alterar o ledger comercial;
- não mudar descartáveis para `R`;
- não alocar SKUs sólidos via round-robin;
- não inventar gramaturas;
- não promover o alpha para Produção.

## Próxima unidade após GREEN

Adicionar um painel **somente de diagnóstico/admin** ou um runner que aceite um snapshot real como entrada, para comparar o RF-REC-1.0.0 e o alpha sombra no mesmo evento, ainda sem interferir na proposta do cliente.
