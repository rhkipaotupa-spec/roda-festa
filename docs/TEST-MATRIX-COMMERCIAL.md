# Roda Festa - Matriz de Testes Comerciais

## Objetivo

Transformar regras de negócio em invariantes executáveis para impedir regressões silenciosas de preço, estrutura e histórico.

## Matriz mínima obrigatória

### Carrinhos

- 0 grupos operacionais -> 0 carrinhos;
- somente frituras -> 1;
- somente mini lanches/tortas -> 1;
- somente bebidas -> 1 e estrutura cobrada;
- frituras + mini lanches -> 2;
- frituras + bebidas -> 2;
- mini lanches + bebidas -> 2;
- três grupos -> 3;
- estrutura exibida = estrutura cobrada = estrutura do ledger.

### Produtos

Para cada produto ativo:

- quantidade respeita lote;
- unitário vem do catálogo vigente;
- subtotal = quantidade x unitário;
- consignação não entra no contratado;
- proposta histórica guarda preço aplicado.

### Horas

- 4h -> sem adicional;
- 5h -> 1 adicional por carrinho;
- 6h -> 2 adicionais por carrinho;
- alteração de carrinhos reflete no adicional.

### Garçons

- não contratado -> R$ 0;
- contratado -> quantidade pela regra vigente;
- ledger contém linha própria;
- subtotal fecha no total.

### Descartáveis

- não contratado -> R$ 0;
- contratado -> cálculo arredondado pela regra vigente;
- ledger contém linha própria.

### Edição

- aumentar quantidade;
- reduzir quantidade;
- remover item;
- adicionar item;
- trocar sabor;
- remover categoria;
- adicionar categoria;
- combinação das operações.

Em todos os casos:

`SUM(ledger) == total aprovado`

### Segurança comercial

- preço unitário adulterado no navegador não altera preço oficial;
- total adulterado é rejeitado;
- quantidade fora do lote é rejeitada;
- carrinhos enviados pelo navegador divergentes são rejeitados;
- produto inexistente/inativo é rejeitado.

### Histórico

- recomendação original preservada;
- aumento aparece como `ITEM_QUANTITY_CHANGED`;
- remoção aparece como `ITEM_REMOVED`;
- inclusão aparece como `ITEM_ADDED`;
- snapshot final contém versões do motor/regras/preços.

### PDF/Admin - futuras

- total exibido = ledger;
- PDF = FinalProposalSnapshot;
- Admin = FinalProposalSnapshot;
- hash da via interna = hash da via cliente;
- alteração futura de preço não muda histórico.

## Regra de promoção

Nenhuma versão nova do motor ou tabela comercial deve ser considerada pronta para produção enquanto a matriz automatizada aplicável não estiver verde.
