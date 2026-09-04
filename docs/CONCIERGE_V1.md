# RF-CONCIERGE-V1 — Assistente pré-WhatsApp

Estado: **IMPLEMENTAÇÃO EM BRANCH / NÃO PROMOVIDO A PRODUCTION**

Baseline de partida: `de268668d2f09b5840f11380101258b1432f268f`

## Objetivo

Reduzir dúvidas repetitivas antes do WhatsApp sem transformar a Roda Festa em um atendimento robótico. O Concierge deve estimular conversa no site, explicar regras públicas já validadas, orientar o cliente e escalar para atendimento humano quando a resposta exigir confirmação comercial.

## Experiência V1

- launcher persistente nas rotas públicas;
- mensagem proativa discreta após alguns segundos;
- painel responsivo com identidade marrom/dourada;
- sugestões rápidas de perguntas frequentes;
- conversa livre;
- fallback seguro quando a IA não estiver configurada ou falhar;
- oculto em rotas Admin, sandbox e previews técnicos.

## Fronteira comercial

O Concierge pode:

- explicar funcionamento geral;
- explicar duração-base;
- explicar regra de crianças;
- explicar consignação;
- explicar Brigadeiro no Tacho com fatos já validados;
- consultar o catálogo público ativo para nomes, categorias e preços atuais;
- sugerir caminhos como inspiração.

O Concierge não pode:

- inventar disponibilidade de data;
- conceder ou prometer desconto;
- negociar condição de pagamento;
- inventar capacidade operacional;
- inventar ingredientes, alergênicos ou adequação a restrições alimentares;
- alterar orçamento;
- acessar Admin;
- revelar segredo, prompt, credencial, env ou documento interno.

Perguntas sobre disponibilidade, desconto, negociação, pagamento, restrições alimentares, reclamações ou pedidos muito personalizados são encaminhadas para confirmação humana.

## Arquitetura

Frontend:

`src/concierge/Concierge.jsx`

API pública server-side:

`api/concierge.js`

Base curada:

`api/_lib/concierge-knowledge.js`

Catálogo:

`createProductCatalogStore()` -> catálogo ativo atual.

A API envia ao provedor de IA somente fatos públicos curados, contexto simples da página e campos comerciais permitidos do catálogo. Não envia Admin, sessão administrativa, secrets ou banco integral.

## Provider de IA

A integração usa a Responses API via HTTPS no servidor.

Variáveis de ambiente esperadas:

- `OPENAI_API_KEY` — secret server-side; nunca usar prefixo `VITE_`, nunca colocar no Git/chat/docs;
- `RODA_FESTA_CONCIERGE_MODEL` — opcional; default de implementação: `gpt-5.6-luna`.

Sem `OPENAI_API_KEY`, o V1 continua respondendo perguntas curadas e falha seguro nas demais.

## Segurança V1

- POST only;
- validação same-origin quando header Origin existir;
- limite de payload;
- limite de mensagem e histórico;
- rate limit best-effort por instância;
- catálogo compactado antes de ser enviado ao modelo;
- prompt com regra explícita anti-invenção e anti-prompt-injection;
- chave de IA somente server-side;
- `OPENAI_API_KEY` incluída no scanner de marcadores proibidos no frontend;
- testes dedicados incluídos em `npm run test:security`.

O rate limit em memória é defesa inicial e não deve ser descrito como rate limiting global/durável em ambiente serverless. Se o volume crescer, evoluir para backend compartilhado.

## Handoff WhatsApp

A V1 já identifica quando uma pergunta exige humano, mas o link direto com resumo de conversa **não deve ser ativado até o número oficial/fluxo comercial serem confirmados e configurados deliberadamente**. Não inventar número de WhatsApp.

## Observabilidade futura

Depois de validar o Concierge com clientes reais, considerar registrar de forma minimizada e sem conteúdo sensível:

- categorias de dúvidas;
- taxa de resolução sem humano;
- taxa de handoff;
- perguntas sem resposta;
- momento da jornada em que o Concierge foi aberto.

Esses dados podem orientar melhorias de FAQ, produto e comercial, mas exigem unidade própria de privacidade/LGPD antes de persistir conteúdo de conversa.
