# CHECKLIST — PRÓXIMA SESSÃO

Estado reconciliado em 03/09/2026 a partir de `main` no commit `e261e3d443f3909d9b256ba47fc9201c1da72647`.

1. Abrir `C:\Projetos\roda-festa` e confirmar `main`, working tree limpa e `HEAD == origin/main` antes de qualquer nova frente.
2. Tratar `e261e3d443f3909d9b256ba47fc9201c1da72647` como baseline seguro de retomada atual até existir um novo merge aprovado.
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
17. **Fluxo obrigatório de segurança:** toda atualização deve seguir `docs/security/SECURITY_UPDATE_FLOW.md`, marcando as superfícies afetadas e executando os gates proporcionais de isolamento de dados, autorização server-side, IDOR, segredos, inputs/XSS e DR.
18. **P1 da auditoria de 03/09/2026 — correção implementada na PR de segurança em validação:** autenticação Admin passa a recarregar a identidade atual por `userId` em toda sessão autenticada; `active=false` invalida a sessão para autorização e downgrade de `role`/`capabilities` passa a valer imediatamente. Preservar os testes RED → GREEN de desativação, downgrade, revogação, rotação e expiração. Considerar o P1 fechado somente depois do merge aprovado e reconciliação pós-merge.
19. Toda rota nova ou alterada que aceite ID deve provar posse/escopo no servidor. Para PlanningSession pública, preservar filtro `sessionId + tokenHash`; para Admin, preservar autenticação + autorização server-side.
20. Toda nova tela/botão privilegiado deve ser cruzada com seu endpoint correspondente. Ocultar UI por role não conta como controle de segurança; o backend precisa negar acesso sem privilégio.
21. Toda mudança em migration, adapter, query, listagem, relatório ou exportação deve revisar RLS/grants e o mecanismo de isolamento aplicável. Nova tabela pública deve nascer com RLS habilitado e grants mínimos.
22. Toda atualização deve revisar segredos no diff. Nunca hardcodar chaves, tokens, senhas, secrets, connection strings privilegiadas ou defaults públicos que possam virar segredo real. Configuração sensível ausente deve falhar fechado.
23. Se a mudança afetar frontend/env de build, confirmar que nenhum segredo server-side entra no bundle Vite. A futura varredura dedicada do histórico Git/object database e de `src/planner.zip` permanece P3 de cobertura, sem assumir vazamento inexistente.
24. Mudanças que renderizem input em HTML/e-mail/PDF/template/markdown devem preservar escape/sanitização adequada. `dangerouslySetInnerHTML`, `innerHTML`, HTML bruto, `eval`, `new Function` e URLs controláveis exigem revisão específica.
25. Antes do PR, executar conforme aplicável: testes focados, `npm test`, `npm run lint`, `npm run build`, `git diff --check`, revisão de segredos e revisão específica de auth/ID/input/banco quando essas superfícies forem alteradas.
26. Mudanças de segurança devem ter teste negativo que falhe antes da correção e passe depois sempre que tecnicamente possível.
27. Novas alterações devem sair de `main` limpa em branch isolada, ser agrupadas em lote autocontido e só então abrir PR.
28. Antes de pedir merge: CI verde no SHA exato do head, Vercel/preview verde quando aplicável, diff revisado sem arquivos inesperados, nenhum segredo no diff e documentação reconciliada quando a mudança alterar arquitetura/segurança/DR.
29. Não mergear PR sem aprovação explícita. Após merge aprovado: reconciliar local/remoto, smoke aplicável, documentação e novo snapshot seguro quando a frente exigir.
30. Nunca registrar senha, token, cookie, chave, service role, connection string com segredo, conteúdo de `.env*` ou chave de backup em chat, docs ou Git.
31. Ao encerrar o dia, deixar claro o último commit seguro, estado da branch, gates executados, pendências reais e se existe ou não snapshot final reconciliado.
