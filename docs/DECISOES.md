# DECISÕES — SITE RODA-FESTA

**Atualizado em:** 03/08/2026

## Decisões de produto

1. O produto não será apresentado como simulador comum.
2. A experiência será tratada como consultoria digital de eventos.
3. A narrativa central é: o cliente escreve o próprio planejamento e a Roda Festa transforma suas escolhas em recomendação.
4. O Planning Book é o centro da experiência.
5. A IA recomenda; o cliente decide e personaliza.
6. O preço deve aparecer depois de valor, contexto e justificativa.
7. Caso o investimento pareça alto, o cliente deve conseguir ajustar escolhas sem recomeçar tudo.

## Decisões de UX

1. Página 1 pergunta.
2. Página 2 interpreta.
3. Painel direito materializa visualmente.
4. Nenhuma área deve repetir a outra sem agregar informação.
5. O CTA da página 1 será `Gerar sugestão Roda Festa para meu evento`.
6. O investimento deve permanecer visível no rodapé real da página 2.
7. `Continuar planejando` preserva dados principais.
8. `Personalizar cardápio` será uma etapa futura, fora da cena visual.
9. A recomendação deve explicar por que a estrutura foi sugerida.
10. A análise animada será curta, elegante e funcional.

## Decisões visuais

1. Welcome aprovada e congelada.
2. Planning Book aprovado em couro escuro, papel grosso e dourado discreto.
3. Não reabrir refinamentos estéticos do livro agora.
4. Cena direita deve ter profundidade e atmosfera.
5. Produtos reais em PNG terão prioridade sobre desenhos CSS.
6. Mostrar poucos produtos grandes em vez de muitas unidades pequenas.
7. Sem cards permanentes sobre carrinhos.
8. Tooltips podem revelar detalhes no hover.
9. Carrinhos, mesa e decoração devem formar composição, não inventário.
10. Botões de ação não devem disputar espaço dentro da cena.

## Decisões técnicas

1. Reaproveitar `EventScene`, `Cart`, `DessertTable`, ativos PNG e infraestrutura de cena existente.
2. Manter `planningRules.js` como fonte de cálculo atual.
3. Usar `buildPlanningScene.js` como adaptador entre o motor e a cena.
4. Criar `SceneDirector.js` para decisões de direção de arte.
5. Manter `SceneLayoutEngine.js` apenas para layout e profundidade.
6. `EventScene.jsx` deve ser renderizador, não cérebro.
7. Preços devem ficar centralizados e facilmente editáveis.
8. Não introduzir API de IA nesta fase; a sensação inteligente pode ser criada com regras e animação.
9. `framer-motion` já está disponível e pode ser utilizado.
10. Trabalhar preferencialmente com arquivos completos prontos para substituir.
