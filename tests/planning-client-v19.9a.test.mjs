import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildProposalPresentation } from "../src/planner/planning-book/proposalPresentation.js";
import { createPlanningSessionRepository } from "../api/_lib/planning-session-repository.js";
import { createMemoryPlanningSessionAdapter } from "../api/_lib/planning-session-adapters/memory.js";
import { startPlanningSessionCommand } from "../api/planning-sessions.js";

test("V19.9A deriva total geral e valores por pessoa sem alterar o contratado", () => {
  const result = buildProposalPresentation({ investmentTotal: 1800, consignmentTotal: 600, realGuests: 40 });
  assert.equal(result.investmentTotal, 1800);
  assert.equal(result.consignmentTotal, 600);
  assert.equal(result.estimatedEventTotal, 2400);
  assert.equal(result.contractedPerPerson, 45);
  assert.equal(result.consignmentPerPerson, 15);
  assert.equal(result.estimatedEventPerPerson, 60);
  assert.equal(result.hasConsignment, true);
});

test("V19.9A sem consignacao preserva estimativa geral igual ao contratado", () => {
  const result = buildProposalPresentation({ investmentTotal: 1250, consignmentTotal: 0, realGuests: 25 });
  assert.equal(result.estimatedEventTotal, 1250);
  assert.equal(result.contractedPerPerson, 50);
  assert.equal(result.estimatedEventPerPerson, 50);
  assert.equal(result.hasConsignment, false);
});

test("V19.9A evita divisao por zero no valor por pessoa", () => {
  const result = buildProposalPresentation({ investmentTotal: 1000, consignmentTotal: 200, realGuests: 0 });
  assert.equal(result.contractedPerPerson, 0);
  assert.equal(result.consignmentPerPerson, 0);
  assert.equal(result.estimatedEventPerPerson, 0);
});

test("V19.9A aceita cha de bebe no boundary autoritativo de PlanningSession", async () => {
  const repository = createPlanningSessionRepository(createMemoryPlanningSessionAdapter());
  const body = {
    clientRequestId: "client-request-cha-bebe-001",
    clientName: "Cliente Teste",
    phone: "14999999999",
    eventType: "cha-bebe",
    eventDate: "2099-08-25",
    adults: 20,
    olderChildren: 0,
    children: 0,
    duration: 4,
    selectedProductIds: ["coxinha-frango-catupiry"],
    includeWaiters: false,
    includeDisposables: false,
  };
  const result = await startPlanningSessionCommand({ body, token: "token-owner", repository, idFactory: () => "session-cha-bebe" });
  assert.equal(result.sessionId, "session-cha-bebe");
});

test("V19.9A mantem tipo de evento desconhecido bloqueado", async () => {
  const repository = createPlanningSessionRepository(createMemoryPlanningSessionAdapter());
  const body = {
    clientRequestId: "client-request-event-invalid",
    clientName: "Cliente Teste",
    phone: "14999999999",
    eventType: "nao-existe",
    eventDate: "2099-08-25",
    adults: 20,
    olderChildren: 0,
    children: 0,
    duration: 4,
    selectedProductIds: ["coxinha-frango-catupiry"],
    includeWaiters: false,
    includeDisposables: false,
  };
  await assert.rejects(() => startPlanningSessionCommand({ body, token: "token-owner", repository }), /invalid_event_type/);
});

test("V19.9A QA organiza leitura financeira sem tres valores por pessoa concorrentes", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const general = '<span>Estimativa geral do evento</span><strong>{formatCurrency(proposalPresentation.estimatedEventTotal)}</strong>';
  const consignment = '<span>Estimativa de consignação</span><strong>{proposalPresentation.hasConsignment ? formatCurrency(proposalPresentation.consignmentTotal) : "Sem consignação"}</strong>';
  const perPerson = '<span>Estimativa por pessoa</span><strong>{formatCurrency(proposalPresentation.estimatedEventPerPerson)}</strong>';
  const generalIndex = source.indexOf(general);
  const consignmentIndex = source.indexOf(consignment);
  const perPersonIndex = source.indexOf(perPerson);
  assert.notEqual(generalIndex, -1);
  assert.notEqual(consignmentIndex, -1);
  assert.notEqual(perPersonIndex, -1);
  assert.ok(consignmentIndex < generalIndex);
  assert.ok(generalIndex < perPersonIndex);
  assert.doesNotMatch(source, /<span>Contratado por pessoa<\/span>/);
  assert.doesNotMatch(source, /proposalPresentation\.consignmentPerPerson/);
  assert.match(source, /Base de cálculo: \{realGuests\} \{realGuests === 1 \? "convidado considerado" : "convidados considerados"\}/);
  assert.match(source, /Considera o investimento contratado \+ a estimativa de consignação\./);
});

test("V19.9A QA preserva capa marrom e mantem o cardapio sem quebra artificial", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  assert.match(source, /\.page\.cover\{min-height:297mm/);
  assert.match(source, /background:linear-gradient\(145deg,#4c2c22,#2f1a12\)!important/);
  assert.match(source, /-webkit-print-color-adjust:exact;print-color-adjust:exact/);
  assert.doesNotMatch(source, /class="page financial-page"/);
  assert.doesNotMatch(source, /\.financial-page\{page-break-before:always/);
});

test("V19.9A QA PDF deixa valor por pessoa apenas na estimativa geral", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const start = source.indexOf("function buildProposalHtml(snapshot) {");
  assert.notEqual(start, -1);
  const end = source.indexOf("\nfunction ", start + 1);
  assert.notEqual(end, -1);
  const pdfBuilder = source.slice(start, end);
  assert.doesNotMatch(pdfBuilder, /presentation\.contractedPerPerson/);
  assert.doesNotMatch(pdfBuilder, /presentation\.consignmentPerPerson/);
  assert.match(pdfBuilder, /presentation\.estimatedEventPerPerson/);
  assert.match(pdfBuilder, /Consignação não incluída neste valor/);
  assert.match(pdfBuilder, /Cobrança posterior apenas do consumo real/);
  assert.match(pdfBuilder, /Contratado \+ estimativa de consignação\. Pode variar conforme o consumo\./);
});

test("V19.9A QA alinha paineis vinho ao marrom aprovado", () => {
  const jsx = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.css", import.meta.url), "utf8");
  const start = jsx.indexOf("function buildProposalHtml(snapshot) {");
  const end = jsx.indexOf("\nfunction ", start + 1);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const pdfBuilder = jsx.slice(start, end);
  assert.match(css, /V19\.9A_QA_BROWN_IDENTITY/);
  assert.match(css, /linear-gradient\(135deg, #4c2c22, #321c13\)/);
  assert.match(pdfBuilder, /linear-gradient\(145deg,#4c2c22,#2f1a12\)/);
  assert.match(pdfBuilder, /money-card--contracted\{background:#4c2c22/);
  assert.doesNotMatch(pdfBuilder, /#5f1f20|#321113/);
});

test("V19.9A QA oferece retorno explicito ao cardapio", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  assert.match(source, />Voltar ao card\u00e1pio<\/button>/);
  assert.doesNotMatch(source, /onClick=\{\(\) => goTo\(2\)\}>Card\u00e1pio<\/button>/);
});

test("V19.9A QA espera recursos antes da impressao e mantem fundo continuo", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const start = source.indexOf("function buildProposalHtml(snapshot) {");
  const end = source.indexOf("\nfunction ", start + 1);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const pdfBuilder = source.slice(start, end);
  assert.match(pdfBuilder, /Array\.from\(document\.images\)/);
  assert.match(pdfBuilder, /document\.fonts&&document\.fonts\.ready/);
  assert.match(pdfBuilder, /requestAnimationFrame/);
  assert.match(pdfBuilder, /window\.setTimeout\(\(\)=>\{window\.focus\(\);window\.print\(\);\},600\)/);
  assert.doesNotMatch(pdfBuilder, /setTimeout\(\(\)=>window\.print\(\),350\)/);
  assert.match(pdfBuilder, /html,body\{background:#fbf5e9!important/);
});

test("V19.9A QA nao duplica consignacao dentro do investimento contratado", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\+ estimativa de \{formatCurrency\(consignmentTotal\)\} em bebidas por consignação\./);
  assert.match(source, /<span>Estimativa de consignação<\/span>/);
});

test("V19.9A QA harmoniza titulos do PDF com a tipografia editorial", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const start = source.indexOf("function buildProposalHtml(snapshot) {");
  const end = source.indexOf("\nfunction ", start + 1);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const pdfBuilder = source.slice(start, end);
  assert.match(pdfBuilder, /\.page:not\(\.cover\)>h1,\.page:not\(\.cover\)>h2,\.terms h2\{font-family:Georgia,serif;font-weight:500;letter-spacing:-\.015em\}/);
});

test("V19.9A QA separa investimento contratado do detalhamento de custos", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.css", import.meta.url), "utf8");
  assert.match(source, /className="rf-contracted-conclusion"/);
  assert.match(source, /Investimento contratado*/);
  assert.match(source, /\* Não inclui bebidas em consignação\./);
  assert.doesNotMatch(source, /className="rf-cost-card__total"/);
  assert.match(css, /V19.9A_QA_CONTRACTED_CONCLUSION/);
});

test("V19.9A QA inicia investimento em pagina final dedicada no PDF", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const start = source.indexOf("function buildProposalHtml(snapshot) {");
  const end = source.indexOf("\nfunction ", start + 1);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const pdfBuilder = source.slice(start, end);
  assert.ok(pdfBuilder.includes('.page.investment-page{page-break-before:always;break-before:page}'));
  assert.ok(pdfBuilder.includes('<section class="page investment-page">\n  <div class="investment-block">'));
  assert.ok(pdfBuilder.includes('.menu-group,.fact,.money-grid,.money-card,.investment-block{page-break-inside:avoid;break-inside:avoid}'));
  assert.match(pdfBuilder, /<div class="investment-block">[\s\S]*?<h1>Investimento<\/h1>[\s\S]*?<div class="money-grid">/);
});

test("V19.9A QA PDF explicita a base de convidados no valor por pessoa", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const start = source.indexOf("function buildProposalHtml(snapshot) {");
  const end = source.indexOf("\nfunction ", start + 1);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const pdfBuilder = source.slice(start, end);
  assert.ok(pdfBuilder.includes('Base de cálculo: ${snapshot.realGuests} ${snapshot.realGuests === 1 ? "convidado" : "convidados"}.'));
});
test("V19.9A QA explicita convidados nas telas que mostram valor por pessoa", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  assert.ok(source.includes('className="rf-per-person-basis"'));
  assert.ok(source.includes('Base dos cálculos por pessoa: {realGuests} {realGuests === 1 ? "convidado considerado" : "convidados considerados"}.'));
});

test("V19.9A QA usa marrom aprovado no header do planner", () => {
  const css = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.css", import.meta.url), "utf8");
  assert.match(css, /V19\.9A_QA_VISUAL_POLISH_V13/);
  assert.match(css, /\.rf-flow-header\s*\{[\s\S]*?linear-gradient\(135deg, #4c2c22, #321c13\)/);
});

test("V19.9A QA tela final prioriza validacao humana sem repetir investimento", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const start = source.indexOf('className="rf-complete"');
  assert.notEqual(start, -1);
  const end = source.indexOf('</section>', start);
  assert.notEqual(end, -1);
  const completion = source.slice(start, end);
  assert.match(completion, /className="rf-complete__analysis"/);
  assert.match(completion, /Validação com a equipe Roda Festa/);
  assert.doesNotMatch(completion, /className="rf-complete__money"/);
  assert.doesNotMatch(completion, /Investimento contratado/);
  assert.match(source, /Seu planejamento foi enviado para análise\. Em breve, nossa equipe fará a validação com você\./);
  assert.match(source, /envio interno não foi confirmado/);
  assert.doesNotMatch(source, /Proposta registrada e validada comercialmente/);
});

test("V19.9A QA apresenta cardapio selecionado com hierarquia editorial no PDF", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const start = source.indexOf("function buildProposalHtml(snapshot) {");
  const end = source.indexOf("\nfunction ", start + 1);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const pdfBuilder = source.slice(start, end);
  assert.match(pdfBuilder, /<h2>Cardápio selecionado<\/h2>/);
  assert.doesNotMatch(pdfBuilder, /Cardápio e quantidades/);
  assert.match(pdfBuilder, /\.menu-group\{margin:6mm 0;border:1px solid #dec9a7;border-radius:4mm;background:#fffaf1/);
  assert.match(pdfBuilder, /\.menu-group h3\{[\s\S]*?color:#f7ead4;[\s\S]*?background:linear-gradient\(135deg,#4c2c22,#321c13\)/);
  assert.match(pdfBuilder, /\.menu-line strong\{[\s\S]*?background:#f3e1c7;[\s\S]*?border-radius:99px/);
  assert.match(pdfBuilder, /\.terms h2\{font-family:Georgia,serif/);
});

test("V19.9A QA mensagem final usa card marrom sem reintroduzir valores", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.css", import.meta.url), "utf8");
  const start = source.indexOf('className="rf-complete"');
  assert.notEqual(start, -1);
  const end = source.indexOf('</section>', start);
  assert.notEqual(end, -1);
  const completion = source.slice(start, end);
  assert.match(completion, /className="rf-complete__analysis"/);
  assert.match(completion, /Validação com a equipe Roda Festa/);
  assert.doesNotMatch(completion, /Investimento contratado/);
  assert.doesNotMatch(completion, /formatCurrency\(proposalPresentation\.investmentTotal\)/);
  assert.match(css, /V19\.9A_QA_VISUAL_POLISH_V14/);
  assert.match(css, /\.rf-complete__analysis\s*\{[\s\S]*?background: linear-gradient\(135deg, #4c2c22, #321c13\)/);
});

test("V19.9A QA recomeçar e criar outro planejamento usam acoes sofisticadas com icone", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  assert.match(source, /className="rf-restart-action rf-restart-action--header"[\s\S]*?<svg[\s\S]*?<span>Recomeçar<\/span>/);
  assert.match(source, /className="rf-restart-action rf-restart-action--final"[\s\S]*?<svg[\s\S]*?<span>Criar outro planejamento<\/span>/);
  assert.doesNotMatch(source, /className="rf-quiet-link rf-quiet-link--light"[^>]*>Recomeçar<\/button>/);
  assert.doesNotMatch(source, /className="rf-quiet-link rf-quiet-link--center"[^>]*>Criar outro planejamento<\/button>/);
});

test("V19.9A QA PDF usa logo creme titulos marrons e condicoes em blocos editoriais", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const start = source.indexOf("function buildProposalHtml(snapshot) {");
  const end = source.indexOf("\nfunction ", start + 1);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const pdfBuilder = source.slice(start, end);
  assert.match(source, /logoUrl: new URL\(rodaFestaLogoCreme, window\.location\.href\)\.href/);
  assert.doesNotMatch(source, /import rodaFestaLogo from/);
  assert.match(pdfBuilder, /\.menu-group h3\{[\s\S]*?background:linear-gradient\(135deg,#4c2c22,#321c13\);[\s\S]*?color:#f7ead4/);
  assert.match(pdfBuilder, /class="terms-head"/);
  assert.match(pdfBuilder, /class="terms-grid"/);
  assert.match(pdfBuilder, /class="term-card term-card--wide"/);
  assert.match(pdfBuilder, /<h3>Contratação<\/h3>/);
  assert.match(pdfBuilder, /<h3>Cancelamento e alterações<\/h3>/);
  assert.match(pdfBuilder, /<h3>Estrutura do evento<\/h3>/);
  assert.match(pdfBuilder, /Cancelamento com até 10 dias de antecedência: cobrança de 50% do orçamento./);
  assert.match(pdfBuilder, /Ao término do evento, os alimentos contratados e não consumidos serão entregues aos anfitriões./);
  assert.match(pdfBuilder, /\.terms-head,\.term-card\{page-break-inside:avoid;break-inside:avoid\}/);
});

test("V19.9A QA remove filete dourado final e usa marrom nos detalhes do cardapio PDF", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.css", import.meta.url), "utf8");

  const start = source.indexOf("function buildProposalHtml(snapshot) {");
  const end = source.indexOf("\nfunction ", start + 1);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const pdfBuilder = source.slice(start, end);

  assert.match(pdfBuilder, /\.menu-group\{[^}]*box-shadow:inset 1\.2mm 0 0 #4c2c22\}/);
  assert.doesNotMatch(pdfBuilder, /\.menu-group\{[^}]*box-shadow:inset 1\.2mm 0 0 #c99a4d\}/);
  assert.match(pdfBuilder, /\.menu-group h3\{[^}]*background:linear-gradient\(135deg,#4c2c22,#321c13\)/);

  const completionRules = [...css.matchAll(/\.rf-complete__analysis\s*\{[^}]*\}/g)].map((match) => match[0]);
  const brownRules = completionRules.filter((rule) => /background:\s*linear-gradient\(135deg, #4c2c22, #321c13\);/.test(rule));
  assert.equal(brownRules.length, 1);
  assert.match(brownRules[0], /border-left:\s*0;/);
  assert.doesNotMatch(brownRules[0], /border-left:\s*5px solid #c99a4d/);
  assert.match(css, /V19\.9A_QA_VISUAL_POLISH_V15_R2/);
});

test("V19.9A QA alinha resumo ao cardapio selecionado e usa slogan em caixa alta no PDF", () => {
  const source = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.jsx", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("../src/planner/planning-book/PlanningBook.css", import.meta.url), "utf8");
  const start = source.indexOf("function buildProposalHtml(snapshot) {");
  const end = source.indexOf("\nfunction ", start + 1);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const pdfBuilder = source.slice(start, end);

  assert.match(pdfBuilder, /V19\.9A_QA_VISUAL_POLISH_V17/);
  assert.match(pdfBuilder, /<div class="cover-tagline">GASTRONOMIA QUE ENCANTA<\/div>/);
  assert.doesNotMatch(pdfBuilder, /<div class="cover-tagline">gastronomia que encanta<\/div>/);
  assert.match(pdfBuilder, /\.cover-tagline\{[^}]*color:#dfc195/);
  assert.match(pdfBuilder, /\.cover h1\{[^}]*color:#dfc195/);

  assert.match(pdfBuilder, /<h2>Resumo do evento<\/h2>/);
  assert.match(pdfBuilder, /<h2>Cardápio selecionado<\/h2>/);
  assert.doesNotMatch(pdfBuilder, /Detalhes do evento/);
  assert.doesNotMatch(pdfBuilder, /class="summary-head"/);
  assert.doesNotMatch(pdfBuilder, /\.summary-head\{/);

  assert.match(pdfBuilder, /\.fact\{[^}]*box-shadow:inset 0 \.75mm 0 #4c2c22/);
  assert.match(pdfBuilder, /\.fact strong\{[^}]*color:#4c2c22/);
  assert.match(pdfBuilder, /\.menu-group\{[^}]*box-shadow:inset 1\.2mm 0 0 #4c2c22/);
  assert.match(pdfBuilder, /class="terms-grid"/);
  assert.match(pdfBuilder, /class="page investment-page"/);
  assert.match(css, /V19\.9A_QA_VISUAL_POLISH_V15_R2/);
});
