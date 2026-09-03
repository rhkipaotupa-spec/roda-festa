# CHECKLIST — PRÓXIMA SESSÃO

Estado reconciliado em 03/09/2026 a partir de `main` no commit `3ba6b42696993916a1cb28991f32e9049e7fe66b`.

1. Abrir `C:\Projetos\roda-festa` e confirmar `main`, working tree limpa e `HEAD == origin/main` antes de qualquer nova frente.
2. Tratar `3ba6b42696993916a1cb28991f32e9049e7fe66b` como baseline seguro de retomada de 02/09/2026 até existir um novo merge aprovado.
3. Não repetir as provas de DR apenas para reconstruir contexto. RF-DR-V1, RF-DR-POLICY-V1 e RF-DR-WEEKLY-OFFSITE-V1 estão concluídas; repetir restore/offsite apenas por rotina, incidente ou mudança relevante.
4. Motor autoritativo atual: `RF-REC-2.1.0`; parâmetros: `RF-PARAM-2.0.0-r4-elicited-2026-08-29`; regras comerciais: `RF-COM-1.0.0`; price book: `RF-PRICE-2026-08-24`.
5. Preservar a entrada histórica de promoção de `RF-REC-2.0.0` em 29/08. A versão `2.1.0` é evolução posterior associada à integração/correção do Brigadeiro no Tacho, não uma reescrita do fato histórico.
6. `RF-REC-2.1.0` continua autoritativo em PlanningBook e PlanningSession; não reativar RF-REC-1 nem tratar R4 como shadow atual.
7. Manter a regra de crianças 0–6 = fator `0,35`; 7+ = `1,0`.
8. Priorizar uso real de Production e feedback da operação antes de nova calibração do motor.
9. Preservar replays, medições físicas e fichas de campo como evidência. Eventos reais calibram versões candidatas; não alterar motor automaticamente por um caso isolado.
10. Manter `lambda_out = 0` como elicitação registrada e `lambda_in`/`kappa_P` com o grau de confiança documentado até nova evidência observada.
11. Tratar `productionPerHour` de produtos novos como ponto de proveniência a investigar: defaults de categoria não devem ser confundidos com capacidade operacional realmente medida. Não alterar comportamento sem unidade técnica própria.
12. Admin atual: Orçamentos, Agenda e Produtos integrados; Archive/Trash/Restore, edição administrativa de orçamento e edição individual/em massa de produtos já fazem parte da linha atual.
13. Catálogo persistido alimenta `/planning-book` via `/api/product-catalog`; alterações de catálogo devem preservar histórico e nunca reprecificar silenciosamente propostas antigas.
14. DR operacional atual: RPO 24h, RTO 4h, backup lógico diário em `D:\Backups\Roda-Festa\daily`, pelo menos 14 gerações diárias, restore drill mensal, cópia semanal AES-256-GCM e offsite Google Drive com meta de 4 gerações.
15. PITR permanece desligado; não habilitar sem decisão explícita baseada em necessidade real de RPO.
16. Antes de migration ou intervenção relevante em dados: backup adicional antes e depois, com gates fail-closed e evidência.
17. Novas alterações devem sair de `main` limpa em branch isolada, ser agrupadas em lote autocontido, passar por testes aplicáveis, lint, build e `git diff --check`, e só então abrir PR.
18. Não mergear PR sem aprovação explícita. Após merge aprovado: reconciliar local/remoto, smoke aplicável, documentação e novo snapshot seguro quando a frente exigir.
19. Nunca registrar senha, token, cookie, chave, service role, connection string com segredo, conteúdo de `.env*` ou chave de backup em chat, docs ou Git.
20. Ao encerrar o dia, deixar claro o último commit seguro, estado da branch, gates executados, pendências reais e se existe ou não snapshot final reconciliado.
