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

## 2026-08-25 - Cliente sem login obrigatório; jornada identificada por sessão server-side

A geração de proposta deve continuar com baixo atrito. A cliente não será obrigada a criar usuário/senha para usar o Planner.

A arquitetura futura criará uma `PlanningSession` anônima no servidor. Telefone/e-mail podem vincular a sessão a um contato. Recuperação em outro dispositivo poderá usar link mágico/código temporário.

Login tradicional poderá ser oferecido no futuro, mas não é pré-requisito arquitetural para histórico confiável.

## 2026-08-25 - Admin no mesmo produto, com autenticação obrigatória

A Central Roda Festa fará parte do mesmo produto e backend, em rota dedicada `/admin`, evitando duplicação de catálogo, regras e infraestrutura.

O Admin terá autenticação e autorização server-side antes de qualquer dado real ser exposto. A primeira fase pode ter apenas perfil `OWNER`; arquitetura preserva expansão para `COMMERCIAL` e `OPERATION`.

## 2026-08-25 - Commercial Ledger é a fonte financeira canônica

O orçamento oficial passa a ser representado por linhas discriminadas de produto/serviço. O total é consequência da soma dessas linhas.

Planner, Admin, PDF e integrações não devem recalcular o orçamento de forma independente.

Uma proposta nova só é íntegra quando a reconciliação do ledger resulta em diferença zero.

## 2026-08-25 - Servidor é autoridade do preço oficial

O navegador transmite escolhas e quantidades, não a verdade financeira.

Na submissão oficial, o servidor reconstrói os produtos pelo catálogo confiável e recalcula estrutura, serviços e total. Valores enviados pelo frontend são apenas comparáveis; divergências devem ser rejeitadas e auditadas.

## 2026-08-25 - Recomendação original é evidência imutável

Quando o motor produz uma sugestão, essa versão deve ser congelada antes de qualquer edição. A proposta final não substitui a recomendação original.

O histórico futuro deve permitir comparar entrada, recomendação, alterações, final e pós-evento.

## 2026-08-25 - Eventos reais calibram o motor, mas não o alteram automaticamente

A base real é evidência para versões candidatas do recomendador. Nenhum evento isolado muda automaticamente a regra em produção.

Novas versões devem ser simuladas retrospectivamente e revisadas pela Roda Festa antes de promoção.

## 2026-08-25 - Padrão oficial de atualização local

O projeto oficial existe somente em `C:\Projetos\roda-festa`.

Toda atualização gerada externamente deve ser aplicada por uma única pasta temporária descartável: `C:\Temp\rf-update`.

Regras permanentes:

- antes de cada nova atualização, limpar/recriar `C:\Temp\rf-update`;
- não criar clones `roda-festa-vXX` em `C:\Projetos`;
- pacotes devem ser autocontidos e preferencialmente trazer `apply-update.cmd` e `validate-update.cmd`;
- `apply-update.cmd` deve validar branch, commit-base e working tree antes de alterar arquivos;
- aplicar somente arquivos completos explicitamente previstos, sem `/MIR` destrutivo e sem edição parcial;
- `validate-update.cmd` executa os gates técnicos aplicáveis antes de commit;
- histórico oficial fica em Git + documentação + snapshots, não em cópias de pastas;
- após aplicação/validação/commit, a pasta temporária pode ser removida.

## 2026-08-25 - Persistencia do Roda Festa nao pode depender da infraestrutura do Simplify

O Roda Festa nao deve exigir pausa, exclusao, reconfiguracao ou reducao de seguranca de nenhum ambiente do Simplify para viabilizar seu desenvolvimento.

Regras permanentes:

- os projetos `simplify` e `simplify-runtime-security` sao infraestrutura independente e nao sao recurso disponivel para liberar capacidade do Roda Festa;
- eventual upgrade de plano/provedor sera decisao futura de custo-beneficio, nunca atalho para contornar limite durante desenvolvimento;
- migrations do Roda Festa nao devem ser executadas em banco do Simplify;
- credenciais, service role keys, connection strings e secrets nao entram em Git, documentacao ou pacotes de atualizacao.

## 2026-08-25 - Dominio de PlanningSession desacoplado do provedor de persistencia

A camada de dominio da jornada nao deve depender diretamente de Supabase.

A V19.7A estabelece um contrato de repositorio para `PlanningSession`, com adapters substituiveis. O adapter em memoria existe somente para testes/controlabilidade e nao e persistencia de producao. O adapter Supabase permanece preparado, porem inativo ate existir infraestrutura aprovada.

Consequencias:

- regra de negocio e seguranca podem ser testadas sem banco remoto;
- troca futura de provedor nao exige reescrever o dominio;
- ausencia de configuracao de producao deve falhar alto, nunca cair silenciosamente para memoria;
- migration pode permanecer versionada sem ser aplicada;
- ativacao de persistencia real sera uma unidade separada, explicitamente validada.

## 2026-08-25 - PlanningSession entra no fluxo somente atras de gate explicito

A integracao do Planner com `PlanningSession` pode existir antes da persistencia remota, mas deve permanecer desligada por padrao enquanto nao houver infraestrutura duravel aprovada.

Regras:

- runtime desabilitado deve responder indisponibilidade de forma explicita;
- memoria nao e fallback de producao;
- migration versionada nao significa migration aplicada;
- ativacao futura exige unidade propria de infraestrutura, validacao e rollback;
- frontend nao pode fingir que historico foi persistido quando o backend estiver indisponivel.

## 2026-08-25 - Recomendacao autoritativa nasce no servidor

O snapshot de recomendacao usado como evidencia historica e financeira deve ser produzido/recalculado pela camada autoritativa do servidor. O navegador pode exibir e comparar a recomendacao, mas nao define sua verdade comercial.

A finalizacao deve partir da recomendacao persistida/guardada, recalcular o final e derivar o delta no servidor. Ownership, versao esperada e idempotencia fazem parte do contrato da sessao.
