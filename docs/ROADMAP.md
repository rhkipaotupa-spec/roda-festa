# Roda Festa - ROADMAP técnico do Planner

## Agora - estabilização V19

- Validar build e lint no Windows.
- Testar a jornada completa em desktop estreito e celular real.
- Revalidar preços, quantidades, carrinhos, horas adicionais, garçons, descartáveis e consignação.
- Validar PDF contra o resumo exibido.
- Configurar e testar a via interna de proposta na Vercel.
- Criar regressões determinísticas para o motor comercial.

## Próxima fundação - integridade comercial

- Mover validação/recalculo de preço oficial para o servidor.
- Persistir snapshot da proposta em armazenamento durável.
- Versionar catálogo/preços para preservar propostas históricas.
- Implementar rate limiting e controles anti-abuso na submissão.
- Definir estados do atendimento: novo, em revisão, proposta enviada, confirmado, cancelado, realizado.

## Depois - limpeza arquitetural

- Inventariar código legado do Planner.
- Remover duplicações somente após prova de não uso.
- Consolidar motor/catálogo/cena em módulos canônicos.
- Eliminar `.bak`, sandboxes e implementações antigas do bundle de produção quando seguro.

## Futuro - Central da Especialista

- Lista de planejamentos.
- Busca por código, cliente e data.
- Revisão de quantidades e categorias.
- Recalculo oficial.
- Histórico imutável das versões enviadas.
- Geração/envio de proposta oficial.
- Conversão de proposta em evento operacional.

## Próxima sessão - 25/08/2026

### P0 - homologação V19.5
- [x] aplicar update V19.5;
- [x] build + lint;
- [x] repetir smoke financeiro crítico de carrinhos/hora adicional;
- [ ] QA mobile 320/360/390/430 px;
- [ ] validar data ontem/hoje/amanhã;
- [ ] validar counters sem overflow;
- [ ] validar welcome clássico e header;
- [ ] homologar personalização completa da recomendação;
- [ ] validar PDF em desktop e celular.

### P0 - PDF canônico e via interna
- gerar PDF pelo sistema, não depender de “Salvar como PDF” do navegador;
- cliente e Roda Festa devem receber o mesmo artefato;
- persistir a via interna de forma durável;
- registrar identificador/hash para comprovar equivalência;
- falha de envio/armazenamento interno deve ficar visível.

### P0 - autoridade comercial
- criar matriz automatizada completa de preços/regras;
- mover autoridade de preço para o servidor;
- bloquear divergência entre snapshot, tela e proposta.

### P1 - segurança e higiene
- tratar `npm audit` de forma controlada;
- mapear legado realmente usado;
- resolver aviso de `colors.css` vazio sem alterar site institucional aprovado.


### Checkpoint de retomada
- Commit técnico V19.5: `46870b17f48c6dc36051971bf1a12267f4367d29`.
- Build/lint/smoke crítico verdes antes do fechamento documental.
- Snapshot só deve ser gerado após commit documental e working tree limpa.
