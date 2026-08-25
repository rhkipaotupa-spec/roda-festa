# Roda Festa - Protocolo de Calibração com Eventos Reais

## Objetivo

Usar festas reais para aprimorar recomendações sem transformar casos isolados em regras arbitrárias.

## Dados a coletar por evento

### Entrada

- tipo de evento;
- data;
- duração;
- adultos;
- crianças 7+;
- crianças 0-6;
- observações de perfil relevantes para consumo.

### Sugestão original

- versão do motor;
- itens;
- quantidades;
- categorias;
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

### Resultado pós-evento

Por item/categoria, quando possível:

- faltou;
- ideal;
- pequena sobra;
- sobra alta;
- sobra aproximada;
- observações.

## Interpretação

A diferença entre recomendação e contratação não prova erro do algoritmo. Preferência pessoal, orçamento, contratação externa e desejo de variedade devem ser separados de evidência de consumo.

O sinal de calibração mais valioso é:

`recomendação -> alteração -> quantidade final -> resultado real`

## Promoção de nova versão

Uma alteração de algoritmo deve ser testada retrospectivamente contra a base de eventos reais. A Roda Festa revisa os resultados antes de promover uma nova versão.

Nenhum dado real deve ser inventado para preencher lacunas. Quando chegar a fase de calibração, solicitar à proprietária somente as informações realmente disponíveis.
