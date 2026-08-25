# V19.6 - Fundação comercial, histórico e arquitetura Admin

Data: 25/08/2026

## Motor comercial

- Adicionado Commercial Ledger canônico.
- Total contratado passa a derivar da soma de linhas discriminadas.
- Reconciliação diferença zero incorporada ao investimento.
- Mantida regra de 3 carrinhos incluindo bebidas em consignação.
- Adicionado versionamento do recomendador, regras comerciais e tabela de preços.

## Histórico

- Recomendação original é congelada antes das edições.
- Snapshot final inclui recomendação original e delta de itens/quantidades.
- Esta etapa é transitória até a PlanningSession persistida no servidor.

## Segurança comercial

- API recalcula preços e estrutura usando catálogo confiável.
- Preço unitário enviado pelo frontend é ignorado.
- Total/carrinhos adulterados são rejeitados.
- Produto desconhecido, quantidade inválida ou fora de lote são rejeitados.
- Data de evento é validada com calendário de America/Sao_Paulo.

## Auditoria interna

- Via interna por e-mail passa a trazer reconciliação financeira discriminada por produto/serviço.
- Alterações detectadas entre recomendação e final são listadas como evidência transitória.

## Testes

- Node Test Runner incorporado.
- 11 testes automatizados verdes no ambiente de preparação.
- Comandos: `npm test` e `npm run test:commercial`.

## Documentação

- ARCHITECTURE-PLANNER-ADMIN.md
- TEST-MATRIX-COMMERCIAL.md
- REAL-EVENT-CALIBRATION.md
- FINDINGS/DECISIONS/ROADMAP/WORKLOG atualizados.

## Gate antes do commit

Executar no Windows oficial:

1. npm test
2. npm run lint
3. npm run build
4. git status --short

Somente depois seguir para commit técnico e reconciliação documental.
