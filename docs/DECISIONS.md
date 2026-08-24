# Roda Festa - DECISIONS

Decisões de produto e arquitetura que devem sobreviver às conversas e orientar alterações futuras.

## 2026-08-24 - Site institucional preservado

O site institucional atual é considerado aprovado. A V19 concentra a refatoração no Planner. Alterações no site só devem ocorrer quando uma integração do Planner exigir e devem ser explicitamente justificadas.

## 2026-08-24 - Planner mobile-first, uma etapa por tela

A experiência principal do Planner é celular. Cada momento da jornada ocupa uma tela própria. Não manter página anterior, visualização paralela ou múltiplas zonas competindo pela atenção apenas para preservar o conceito antigo de livro aberto.

Fluxo-base:

`Welcome -> Informações -> Cardápio -> Ajustes -> Validação -> Conclusão`

A identidade visual do livro pode continuar em textura, transições e linguagem, mas não determina mais a arquitetura de navegação.

## 2026-08-24 - Carrinho de consignação é estrutura cobrada

Se um grupo operacional exige um carrinho, esse carrinho compõe a estrutura paga, inclusive bebidas em consignação. A consignação se aplica ao consumo das bebidas, não à gratuidade do equipamento/estrutura.

## 2026-08-24 - Snapshot imutável da proposta

Ao concluir o planejamento, criar uma representação imutável com código, cliente, convidados, itens, quantidades, preços aplicados, carrinhos, serviços, consignação e total. A via do cliente e a via interna devem derivar do mesmo snapshot.

## 2026-08-24 - Preços de tortas/porções de 150 g

Tabela vigente a partir desta versão:

| Item | Preço / 150 g |
| --- | ---: |
| Cebola caramelizada com queijo | R$ 7,00 |
| Strogonoff de frango | R$ 7,00 |
| Frango com catupiry | R$ 7,00 |
| Frango com cream cheese e ervas | R$ 7,00 |
| Palmito com catupiry | R$ 9,00 |
| Camarão com catupiry | R$ 15,00 |
| Carne louca com cheddar | R$ 15,00 |
| Bacalhau com catupiry | R$ 15,00 |

## 2026-08-24 - Lint não deve forçar refatoração visual do site congelado

O site institucional está aprovado e fora do escopo funcional da V19. Regras novas do ESLint que acusam padrões preexistentes de `setState` em efeitos nas cenas institucionais não justificam alterar comportamento visual apenas para obter baseline verde.

A configuração pode conter exceções **específicas e documentadas por arquivo** para legado aprovado. Código novo do Planner e da API continua sujeito ao baseline normal. A exceção não deve ser ampliada globalmente sem finding e decisão explícita.


## 2026-08-24 - Mobile-first não elimina a identidade de caderno

A decisão “uma etapa por tela” permanece. O que muda é a linguagem visual: cada etapa deve parecer uma página do Planner Roda Festa, com assinatura vinho/dourado, papel, profundidade e hierarquia editorial. A interface não deve voltar ao livro aberto com múltiplas páginas competindo pela atenção, mas também não deve se reduzir a um formulário genérico.

## 2026-08-24 - Recomendação é ponto de partida totalmente editável

A recomendação automática nunca é uma composição fechada. Na etapa de ajustes, a pessoa deve poder, dentro do catálogo e das regras operacionais disponíveis:

- aumentar ou reduzir quantidade;
- trocar um item/sabor por outro da categoria;
- adicionar outro item à categoria;
- retirar um item;
- retirar uma categoria inteira;
- adicionar uma categoria ausente;
- ativar/desativar serviços opcionais.

Toda alteração deve recalcular imediatamente itens, carrinhos, equipe, horas adicionais, consignação e investimento usando a mesma fonte de verdade do motor.

## 2026-08-24 - Welcome clássico é referência visual congelada

A capa/welcome de referência é a versão marrom-escura tipo caderno premium, com lombada, molduras douradas, textura discreta, logo creme, título “Meu Planejamento”, campos de nome/telefone/data e CTA dourado. A V19 pode simplificar a navegação interna, mas não deve descaracterizar essa entrada sem aprovação explícita.

## 2026-08-24 - Data de evento nunca pode ser anterior ao dia corrente

O Planner deve bloquear no componente e também na lógica qualquer data anterior à data local atual. A validação não pode depender apenas do seletor nativo do navegador.

## 2026-08-24 - Via interna deve ser o mesmo PDF canônico entregue ao cliente

Não basta receber apenas JSON/snapshot ou uma reconstrução posterior. O sistema deve gerar um artefato canônico a partir do snapshot imutável e usar exatamente esse artefato para a via do cliente e a via interna da Roda Festa. A implementação final deve permitir prova de equivalência por identificador/hash e persistência durável.
