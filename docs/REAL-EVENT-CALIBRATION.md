# Roda Festa - Protocolo de Calibração com Eventos Reais

## Objetivo

Usar festas reais para aprimorar recomendações sem transformar casos isolados em regras arbitrárias e sem confundir contratação, planejamento, consumo, takeaway ou sobra.

## Dados a coletar por evento

### Entrada

- tipo de evento;
- data;
- duração;
- adultos;
- crianças 7+;
- crianças 0-6;
- observações de perfil relevantes para consumo;
- categorias contratadas com a Roda Festa;
- categorias presentes por fornecedor externo, especialmente Mini lanches e Tortas;
- `S_presente = S_contratado ∪ S_externo`.

### Sugestão original

- versão do motor;
- itens;
- quantidades;
- categorias;
- M previsto por categoria quando disponível;
- M* planejado por categoria quando disponível;
- Q operacional após lote/alocação;
- carrinhos;
- serviços;
- total.

### Alterações

- item/categoria alterado;
- antes;
- depois;
- ator: cliente ou Roda Festa;
- motivo, quando conhecido.

### Final contratado

- itens e quantidades;
- estrutura;
- serviços;
- valor final;
- ledger reconciliado.

O final contratado não deve ser interpretado automaticamente como consumo esperado ou consumo observado.

### Resultado pós-evento

Por item/categoria, quando possível, registrar separadamente:

- Q efetivamente levado/produzido;
- sobra/retorno mensurável;
- faltou / ideal / pequena sobra / sobra alta;
- takeaway: quantidade levada pelos convidados em marmitinha/saquinho;
- consumo observado derivado somente quando o balanço permitir;
- observações.

Para Bolos e Doces, incluir obrigatoriamente:

`Levado pelos convidados (marmitinha / saquinho): ______ porções / unidades`

Quando houver mais de um sabor e for operacionalmente possível, registrar também sobra/takeaway por sabor/SKU.

## Semântica obrigatória

- `M_c`: média esperada de consumo, sem margem escondida;
- `M*_c`: planejamento conservador/segurança, separado de M;
- `Q_c`: quantidade operacional após lotes, quantização e alocação;
- takeaway: demanda que sai com convidados e não é consumo no evento;
- sobra/retorno: material remanescente mensurado.

Nunca usar `Q - sobra` como consumo se parte do produto foi levada pelos convidados sem ser registrada.

## Interpretação

A diferença entre recomendação e contratação não prova erro do algoritmo. Preferência pessoal, orçamento, contratação externa, desejo de variedade e intensidade de intervenção humana devem ser separados de evidência de consumo.

O sinal de calibração mais valioso passa a ser:

`M previsto -> M* planejado -> Q levado -> takeaway -> sobra -> consumo observado derivado`

A trilha comercial paralela continua sendo:

`recomendação -> alterações -> final contratado`

As duas trilhas não devem ser confundidas.

## Replays

Laiana, Maysa e Yasmin permanecem fixtures históricas úteis, mas NÃO devem ser aprovadas por proximidade ao final humano.

Para uma nova versão:

1. pré-registrar o resultado do motor antes de reabrir o final humano;
2. validar invariantes;
3. validar massa total em faixa declarada;
4. variar número de sabores até o catálogo inteiro para provar ausência de explosão;
5. só depois comparar com decisões humanas como evidência contextual.

## Promoção de nova versão

Uma alteração de algoritmo deve ser testada retrospectivamente contra a base de eventos reais. A Roda Festa revisa os resultados antes de promover uma nova versão.

Nenhum dado real deve ser inventado para preencher lacunas. Campos desconhecidos permanecem explicitamente pendentes.
