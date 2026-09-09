# RF Product Batch — 09/09/2026

Baseline: `4cc21f002944111aaa21ba703c9e7251557feb42`.

Escopo aprovado por feedback real:

- edição de convidados em revisão administrativa;
- crianças 0–6 = 0,50 equivalente;
- auditoria/correção de links e CTAs do site institucional;
- cardápio institucional alimentado pelo catálogo público autoritativo;
- DTO público do catálogo sem campos operacionais internos.

## Contratos

A proposta final original não é sobrescrita. A revisão administrativa continua append-only e registra a nova quantidade de convidados no snapshot efetivo e no resumo de histórico.

Alterar convidados não regenera silenciosamente produtos negociados. Garçons/descartáveis e totais dependentes são recalculados.

O fator 0,50 é aplicado somente à faixa de 0–6 anos. Faixa 7+ continua 1,0.

O site institucional não deve possuir links de navegação para âncoras inexistentes. `#como-funciona`, `#eventos`, `#cardapio` e `#contato` são contratos testados.

O catálogo institucional usa `/api/product-catalog`; o endpoint publica apenas dados comerciais necessários e não parâmetros operacionais internos.
