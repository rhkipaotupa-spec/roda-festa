import { useMemo, useState } from "react";

import "./PlanningBook.css";

import {
  PRODUCTS,
  ENGINE_VERSIONS,
  calculateCarts,
  calculateDisposables,
  calculateInvestment,
  calculatePreparers,
  calculateSuggestedProductQuantity,
  calculateWaiters,
  evaluateSuggestion,
  generatePlanningSuggestion,
} from "./engine/planningRules";
import { createRecommendationSnapshot, compareRecommendationToFinal } from "./engine/planningHistory.js";

import rodaFestaLogo from "./assets/logo-roda-festa.png";
import rodaFestaLogoCreme from "./assets/logo-roda-festa-creme.png";
import carBurger from "./assets/car-burger.png";
import carFrituras from "./assets/car-frituras.png";
import carHotDog from "./assets/car-hot-dog.png";
import carBurgerHotDog from "./assets/car-burger-hot-dog.png";
import carDrinks from "./assets/car-drinks.png";
import tableBolo from "./assets/table-bolo.png";
import tableDoces from "./assets/table-doces.png";
import tableBoloDoces from "./assets/table-bolo-doces.png";

const STEPS = [
  { id: "welcome", label: "Início" },
  { id: "info", label: "Evento" },
  { id: "menu", label: "Cardápio" },
  { id: "adjust", label: "Ajustes" },
  { id: "review", label: "Validação" },
  { id: "done", label: "Concluído" },
];

const EVENT_OPTIONS = [
  { id: "infantil", label: "Festa Infantil", description: "Leve, acolhedora e pensada para toda a família." },
  { id: "casamento", label: "Casamento", description: "Uma composição elegante para um momento especial." },
  { id: "corporativo", label: "Evento Corporativo", description: "Atendimento organizado para ambientes profissionais." },
];

const MENU_CATEGORIES = [
  { id: "mini-lanches", title: "Mini Lanches", commercialCategory: "Mini lanches", subtitle: "Lanches preparados durante o evento." },
  { id: "petiscos", title: "Salgadinhos Fritos", commercialCategory: "Petiscos", subtitle: "Escolha os sabores que deseja servir." },
  { id: "tortas", title: "Tortas", commercialCategory: "Tortas", subtitle: "Porções individuais de 150 g." },
  { id: "doces", title: "Doces", commercialCategory: "Doces", subtitle: "Doces entregues prontos." },
  { id: "bolos", title: "Bolos", commercialCategory: "Bolos", subtitle: "Porções individuais de 120 g." },
  { id: "bebidas", title: "Bebidas", commercialCategory: "Bebidas", subtitle: "Em consignação: cobradas apenas conforme o consumo." },
];

const CATEGORY_ORDER = ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos", "Bebidas"];
const PRODUCT_CATALOG = Object.values(PRODUCTS);

const COMMERCIAL_TERMS = {
  validity: "5 dias",
  payment: "Pix ou dinheiro",
  reservation: "50% no ato da contratação para reserva da data.",
  balance: "50% até 24 horas antes do evento.",
  serviceArea: "Atendimento incluído apenas para eventos em Tupã.",
  contact: "(14) 99896-0208",
  instagram: "@rodafesta",
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value) {
  if (!value) return "Data a definir";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function getToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function createPlanningCode() {
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  let sequence;

  try {
    const key = `roda-festa-planning-sequence-${datePart}`;
    sequence = Number(window.localStorage.getItem(key) || 0) + 1;
    window.localStorage.setItem(key, String(sequence));
  } catch {
    sequence = Number(String(Date.now()).slice(-5));
  }

  return `RF-${datePart}-${String(sequence).padStart(5, "0")}`;
}

function getPriceLabel(product) {
  if (product.priceUnit === "portion150g") return `${formatCurrency(product.unitPrice)} / 150 g`;
  if (product.priceUnit === "portion120g") return `${formatCurrency(product.unitPrice)} / 120 g`;
  if (product.priceUnit === "kg") return `${formatCurrency(product.unitPrice)} / kg`;
  return `${formatCurrency(product.unitPrice)} / un.`;
}

function getQuantityLabel(item) {
  const quantity = Number(item.quantity) || 0;
  if (item.priceUnit === "portion150g") return `${quantity} ${quantity === 1 ? "porção" : "porções"} de 150 g`;
  if (item.priceUnit === "portion120g") return `${quantity} ${quantity === 1 ? "porção" : "porções"} de 120 g`;
  if (item.priceUnit === "kg") return `${quantity.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
  return `${quantity.toLocaleString("pt-BR")} un.`;
}

function getItemValue(item) {
  if (item.consignment) return Number(item.quantity || 0) * Number(item.unitPrice || 0);
  return Number(item.estimatedValue || 0);
}

function getConsignmentTotal(items = []) {
  return items
    .filter((item) => item.consignment)
    .reduce((sum, item) => sum + getItemValue(item), 0);
}

function getSceneObjects(items = []) {
  const ids = new Set(items.filter((item) => Number(item.quantity) > 0).map((item) => item.id));
  const groups = new Set(items.filter((item) => Number(item.quantity) > 0).map((item) => item.operationalGroup));
  const result = [];

  if (groups.has("fried")) result.push({ id: "fried", label: "Carrinho de petiscos", src: carFrituras });

  if (groups.has("hotSandwiches")) {
    const hasBurger = ids.has("mini-x-burguer") || ids.has("mini-x-salada");
    const hasHotDog = ids.has("mini-hot-dog");
    result.push({
      id: "hot",
      label: "Carrinho de mini lanches e tortas",
      src: hasBurger && hasHotDog ? carBurgerHotDog : hasHotDog ? carHotDog : carBurger,
    });
  }

  if (groups.has("beverages")) result.push({ id: "drinks", label: "Carrinho de bebidas", src: carDrinks });

  const hasCake = groups.has("cake");
  const hasSweets = groups.has("sweets");
  if (hasCake || hasSweets) {
    result.push({
      id: "desserts",
      label: "Doces e bolo",
      src: hasCake && hasSweets ? tableBoloDoces : hasCake ? tableBolo : tableDoces,
      table: true,
    });
  }

  return result;
}

function rebuildSuggestion(baseSuggestion, items, serviceHours, includeWaiters, includeDisposables) {
  const carts = calculateCarts({
    items,
    serviceHours,
    equivalentGuests: baseSuggestion.guests.equivalentGuests,
  });
  const preparers = calculatePreparers(carts.totalCarts);
  const waiters = calculateWaiters({
    realGuests: baseSuggestion.guests.realGuests,
    includeWaiters,
  });
  const disposables = calculateDisposables({
    equivalentGuests: baseSuggestion.guests.equivalentGuests,
    includeDisposables,
  });
  const investment = calculateInvestment({
    items,
    totalCarts: carts.totalCarts,
    serviceHours,
    waiters,
    disposables,
  });
  const evaluation = evaluateSuggestion({
    equivalentGuests: baseSuggestion.guests.equivalentGuests,
    items,
    totalCarts: carts.totalCarts,
  });

  return {
    ...baseSuggestion,
    items,
    carts,
    preparers,
    waiters,
    disposables,
    investment,
    evaluation,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildProposalHtml(snapshot) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: snapshot.items.filter((item) => item.commercialCategory === category),
  })).filter((group) => group.items.length > 0);

  const groupsHtml = grouped.map((group) => `
    <section class="menu-group">
      <h3>${escapeHtml(group.category === "Bebidas" ? "Bebidas em consignação" : group.category)}</h3>
      ${group.items.map((item) => `<div class="menu-line"><span>${escapeHtml(item.name)}</span><strong>${escapeHtml(item.quantityLabel)}</strong></div>`).join("")}
    </section>
  `).join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Proposta ${escapeHtml(snapshot.code)}</title>
<style>
@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#eee;color:#432b20;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{width:210mm;min-height:297mm;margin:0 auto 12px;padding:18mm;background:#fbf5e9;page-break-after:always;position:relative}.page:last-child{page-break-after:auto}.cover{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:linear-gradient(145deg,#5f1f20,#321113);color:#f7ead4}.cover img{width:62mm;margin-bottom:16mm}.cover .eyebrow{letter-spacing:.22em;text-transform:uppercase;font-size:10pt;color:#d9b36b}.cover h1{font-family:Georgia,serif;font-size:30pt;margin:5mm 0 2mm}.cover h2{font-size:18pt;font-weight:400;margin:0 0 12mm}.chips{display:flex;gap:4mm;flex-wrap:wrap;justify-content:center}.chips span{border:1px solid rgba(255,255,255,.28);border-radius:99px;padding:3mm 5mm}.brandline{display:flex;justify-content:space-between;border-bottom:1px solid #caa976;padding-bottom:4mm;margin-bottom:8mm}.brandline strong{letter-spacing:.13em}.facts{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin:8mm 0}.fact{border:1px solid #dec9a7;border-radius:4mm;padding:4mm;background:#fffaf1}.fact span{display:block;font-size:8pt;text-transform:uppercase;letter-spacing:.08em;color:#806451}.fact strong{display:block;margin-top:2mm}.menu-group{margin:7mm 0}.menu-group h3{font-family:Georgia,serif;border-bottom:1px solid #d5bd98;padding-bottom:2mm}.menu-line{display:flex;justify-content:space-between;gap:8mm;padding:2mm 0}.financial{background:#5f1f20;color:#fff1dd;border-radius:5mm;padding:7mm;margin:8mm 0}.financial span{font-size:9pt;text-transform:uppercase;letter-spacing:.09em}.financial strong{display:block;font-family:Georgia,serif;font-size:24pt;margin-top:2mm}.consignment{border:1px solid #d4b783;border-radius:4mm;padding:5mm;margin-top:5mm}.terms p{font-size:9.5pt;line-height:1.5;margin:2.5mm 0}.footer{position:absolute;left:18mm;right:18mm;bottom:12mm;border-top:1px solid #caa976;padding-top:5mm;display:flex;justify-content:space-between;font-size:9pt}@media screen{.page{box-shadow:0 18px 55px rgba(0,0,0,.18)}.print-note{position:sticky;top:0;z-index:5;background:#fff;padding:12px;text-align:center}}@media print{body{background:white}.print-note{display:none}.page{margin:0;box-shadow:none}}
</style>
</head>
<body>
<div class="print-note">Na janela de impressão, escolha “Salvar como PDF”.</div>
<section class="page cover">
  <img src="${escapeHtml(snapshot.logoUrl)}" alt="Roda Festa" />
  <div class="eyebrow">Proposta comercial</div>
  <h1>${escapeHtml(snapshot.eventLabel)}</h1>
  <h2>${escapeHtml(snapshot.clientName)}</h2>
  <div class="chips"><span>${escapeHtml(snapshot.eventDateLabel)}</span><span>${snapshot.realGuests} convidados</span><span>${snapshot.duration} horas</span></div>
</section>
<section class="page">
  <div class="brandline"><strong>RODA FESTA</strong><span>Gastronomia que encanta</span></div>
  <h1>Resumo do evento</h1>
  <div class="facts">
    <div class="fact"><span>Código</span><strong>${escapeHtml(snapshot.code)}</strong></div>
    <div class="fact"><span>Cliente</span><strong>${escapeHtml(snapshot.clientName)}</strong></div>
    <div class="fact"><span>Telefone</span><strong>${escapeHtml(snapshot.phone)}</strong></div>
    <div class="fact"><span>Data</span><strong>${escapeHtml(snapshot.eventDateLabel)}</strong></div>
    <div class="fact"><span>Convidados</span><strong>${snapshot.adults} adultos, ${snapshot.olderChildren} crianças 7+, ${snapshot.children} crianças 0–6</strong></div>
    <div class="fact"><span>Estrutura</span><strong>${snapshot.totalCarts} ${snapshot.totalCarts === 1 ? "carrinho" : "carrinhos"}</strong></div>
  </div>
  <h2>Cardápio e quantidades</h2>
  ${groupsHtml}
</section>
<section class="page">
  <div class="brandline"><strong>RODA FESTA</strong><span>Proposta comercial</span></div>
  <h1>Investimento</h1>
  <div class="financial"><span>Investimento contratado</span><strong>${escapeHtml(formatCurrency(snapshot.investmentTotal))}</strong><small>Bebidas em consignação não estão incluídas neste valor.</small></div>
  <div class="consignment"><span>Estimativa de consignação</span><strong>${escapeHtml(snapshot.consignmentTotal > 0 ? formatCurrency(snapshot.consignmentTotal) : "Sem bebidas")}</strong><p>Cobrança posterior apenas das unidades efetivamente consumidas.</p></div>
  <div class="terms">
    <h2>Condições comerciais e operacionais</h2>
    <p><strong>Validade:</strong> 5 dias.</p><p><strong>Pagamento:</strong> Pix ou dinheiro.</p><p><strong>Reserva:</strong> 50% no ato da contratação.</p><p><strong>Saldo:</strong> 50% até 24 horas antes do evento.</p><p><strong>Área de atendimento:</strong> atendimento incluído apenas para eventos em Tupã.</p><p>Cancelamento com até 10 dias de antecedência: cobrança de 50% do orçamento.</p><p>Cancelamento com até 3 dias de antecedência: cobrança integral do orçamento.</p><p>Alteração de data com até 5 dias de antecedência: taxa de 50%, sujeita à disponibilidade.</p><p>Utilizamos tomadas 110V e 220V. Fios, extensões e transformadores já estão contemplados no orçamento.</p><p>A amperagem necessária será informada previamente e deverá ser providenciada pelo cliente.</p><p>Ao término do evento, os alimentos contratados e não consumidos serão entregues aos anfitriões.</p>
  </div>
  <footer class="footer"><strong>Roda Festa</strong><span>${escapeHtml(COMMERCIAL_TERMS.contact)} · ${escapeHtml(COMMERCIAL_TERMS.instagram)}</span></footer>
</section>
<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350));</script>
</body></html>`;
}

function Progress({ stepIndex }) {
  if (stepIndex <= 0 || stepIndex >= STEPS.length - 1) return null;
  const visibleSteps = STEPS.slice(1, -1);
  return (
    <div className="rf-flow-progress" aria-label={`Etapa ${stepIndex} de ${visibleSteps.length}`}>
      <div className="rf-flow-progress__top"><span>Seu planejamento</span><strong>{stepIndex}/{visibleSteps.length}</strong></div>
      <div className="rf-flow-progress__bar"><span style={{ width: `${(stepIndex / visibleSteps.length) * 100}%` }} /></div>
      <small>{STEPS[stepIndex].label}</small>
    </div>
  );
}

function Counter({ label, hint, value, onChange }) {
  return (
    <div className="rf-counter-row">
      <div><strong>{label}</strong><span>{hint}</span></div>
      <div className="rf-counter">
        <button type="button" onClick={() => onChange(Math.max(0, Number(value) - 1))} aria-label={`Diminuir ${label}`}>−</button>
        <input type="number" min="0" max="100" inputMode="numeric" value={value} onFocus={(event) => event.target.select()} onChange={(event) => onChange(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} />
        <button type="button" onClick={() => onChange(Math.min(100, Number(value) + 1))} aria-label={`Aumentar ${label}`}>+</button>
      </div>
    </div>
  );
}

export default function PlanningBook() {
  const [stepIndex, setStepIndex] = useState(0);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [adults, setAdults] = useState(0);
  const [olderChildren, setOlderChildren] = useState(0);
  const [children, setChildren] = useState(0);
  const [duration, setDuration] = useState(4);
  const [includeWaiters, setIncludeWaiters] = useState(false);
  const [includeDisposables, setIncludeDisposables] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState("");
  const [suggestion, setSuggestion] = useState(null);
  const [initialRecommendationSnapshot, setInitialRecommendationSnapshot] = useState(null);
  const [planningCode, setPlanningCode] = useState("");
  const [errors, setErrors] = useState({});
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [replacingItemId, setReplacingItemId] = useState("");

  const eventData = EVENT_OPTIONS.find((item) => item.id === selectedEvent);
  const realGuests = adults + olderChildren + children;
  const equivalentGuests = adults + olderChildren + children * 0.5;
  const planningAdults = adults + olderChildren;

  const categories = useMemo(() => MENU_CATEGORIES.map((category) => ({
    ...category,
    products: PRODUCT_CATALOG.filter((product) => product.active && product.commercialCategory === category.commercialCategory),
  })), []);

  const sceneObjects = useMemo(() => getSceneObjects(suggestion?.items || []), [suggestion]);
  const consignmentTotal = suggestion ? getConsignmentTotal(suggestion.items) : 0;

  function goTo(index) {
    setErrors({});
    setFormNotice("");
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, index)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateWelcome() {
    const next = {};
    const phoneDigits = phone.replace(/\D/g, "");
    if (!clientName.trim()) next.clientName = "Informe seu nome.";
    if (phoneDigits.length < 10) next.phone = "Informe um telefone válido com DDD.";
    if (!eventDate) next.eventDate = "Escolha a data do evento.";
    else if (eventDate < getToday()) next.eventDate = "A data não pode ser anterior a hoje.";
    setErrors(next);
    const firstMessage = next.clientName || next.phone || next.eventDate || "";
    setFormNotice(firstMessage ? `Antes de seguir: ${firstMessage}` : "");
    return Object.keys(next).length === 0;
  }

  function validateInfo() {
    const next = {};
    if (!selectedEvent) next.selectedEvent = "Escolha o tipo de evento.";
    if (realGuests <= 0) next.guests = "Informe pelo menos um convidado.";
    setErrors(next);
    const firstMessage = next.selectedEvent || next.guests || "";
    setFormNotice(firstMessage ? `Antes de seguir: ${firstMessage}` : "");
    return Object.keys(next).length === 0;
  }

  function handleEventDateChange(value) {
    if (value && value < getToday()) {
      setEventDate("");
      setErrors((current) => ({ ...current, eventDate: "A data não pode ser anterior a hoje." }));
      setFormNotice("Antes de seguir: A data não pode ser anterior a hoje.");
      return;
    }
    setEventDate(value);
    setErrors((current) => ({ ...current, eventDate: "" }));
    setFormNotice("");
  }

  function toggleProduct(productId) {
    setSelectedProductIds((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  }

  function generateSuggestionAndContinue() {
    if (selectedProductIds.length === 0) {
      setErrors({ menu: "Escolha pelo menos um item do cardápio." });
      return;
    }

    const includeBeverages = selectedProductIds.some((id) => PRODUCT_CATALOG.find((product) => product.id === id)?.consignment);
    const generated = generatePlanningSuggestion({
      adults: planningAdults,
      children,
      serviceHours: duration,
      selectedProductIds,
      includeWaiters,
      includeDisposables,
      includeBeverages,
      additionalProductIds: [],
    });

    const recommendationSnapshot = createRecommendationSnapshot({
      suggestion: generated,
      context: {
        eventType: selectedEvent,
        eventDate,
        adults,
        olderChildren,
        children,
        realGuests,
        equivalentGuests,
        duration,
      },
      versions: generated.versions || ENGINE_VERSIONS,
    });

    setInitialRecommendationSnapshot(recommendationSnapshot);
    setSuggestion(generated);
    goTo(3);
  }

  function addProductToSuggestion(product) {
    if (!suggestion || suggestion.items.some((item) => item.id === product.id)) return;
    const lot = Number(product.lotSize) || 1;
    const suggested = calculateSuggestedProductQuantity({ product, equivalentGuests });
    const quantity = Math.max(lot, Number(suggested) || lot);
    const nextItem = {
      ...product,
      quantity,
      estimatedValue: product.consignment ? 0 : quantity * Number(product.unitPrice || 0),
    };
    const items = [...suggestion.items, nextItem];
    setSelectedProductIds((current) => [...new Set([...current, product.id])]);
    setSuggestion(rebuildSuggestion(suggestion, items, duration, includeWaiters, includeDisposables));
    setEditingCategory(product.commercialCategory);
  }

  function removeItemFromSuggestion(itemId) {
    if (!suggestion) return;
    const items = suggestion.items.filter((item) => item.id !== itemId);
    setSelectedProductIds((current) => current.filter((id) => id !== itemId));
    setSuggestion(rebuildSuggestion(suggestion, items, duration, includeWaiters, includeDisposables));
    if (replacingItemId === itemId) setReplacingItemId("");
  }

  function removeCategoryFromSuggestion(categoryName) {
    if (!suggestion) return;
    const removedIds = new Set(suggestion.items.filter((item) => item.commercialCategory === categoryName).map((item) => item.id));
    const items = suggestion.items.filter((item) => item.commercialCategory !== categoryName);
    setSelectedProductIds((current) => current.filter((id) => !removedIds.has(id)));
    setSuggestion(rebuildSuggestion(suggestion, items, duration, includeWaiters, includeDisposables));
    setEditingCategory("");
    setReplacingItemId("");
  }

  function replaceSuggestionItem(currentItemId, product) {
    if (!suggestion) return;
    const currentItem = suggestion.items.find((item) => item.id === currentItemId);
    if (!currentItem || product.id === currentItemId) return;
    const lot = Number(product.lotSize) || 1;
    const quantity = Math.max(lot, Math.ceil(Number(currentItem.quantity || lot) / lot) * lot);
    const replacement = {
      ...product,
      quantity,
      estimatedValue: product.consignment ? 0 : quantity * Number(product.unitPrice || 0),
    };
    const items = suggestion.items.map((item) => item.id === currentItemId ? replacement : item);
    setSelectedProductIds((current) => [...new Set(current.filter((id) => id !== currentItemId).concat(product.id))]);
    setSuggestion(rebuildSuggestion(suggestion, items, duration, includeWaiters, includeDisposables));
    setReplacingItemId("");
    setEditingCategory(product.commercialCategory);
  }

  function changeItemQuantity(itemId, nextQuantity) {
    if (!suggestion) return;
    const current = suggestion.items.find((item) => item.id === itemId);
    if (!current) return;
    const lot = Number(current.lotSize) || 1;
    const normalized = Math.max(0, Math.round((Number(nextQuantity) || 0) / lot) * lot);
    const items = suggestion.items
      .map((item) => item.id === itemId
        ? { ...item, quantity: normalized, estimatedValue: item.consignment ? 0 : normalized * Number(item.unitPrice || 0) }
        : item)
      .filter((item) => Number(item.quantity) > 0);
    setSuggestion(rebuildSuggestion(suggestion, items, duration, includeWaiters, includeDisposables));
  }

  function syncOptionalServices(nextWaiters, nextDisposables) {
    setIncludeWaiters(nextWaiters);
    setIncludeDisposables(nextDisposables);
    if (suggestion) setSuggestion(rebuildSuggestion(suggestion, suggestion.items, duration, nextWaiters, nextDisposables));
  }

  function buildSnapshot(code) {
    const finalItems = (suggestion?.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      commercialCategory: item.commercialCategory,
      operationalGroup: item.operationalGroup,
      quantity: item.quantity,
      quantityLabel: getQuantityLabel(item),
      unitPrice: item.unitPrice,
      priceUnit: item.priceUnit || "unit",
      consignment: Boolean(item.consignment),
      estimatedValue: item.estimatedValue || 0,
    }));
    const changes = compareRecommendationToFinal(initialRecommendationSnapshot, finalItems);
    const ledger = suggestion?.investment?.ledger || null;
    const reconciliation = suggestion?.investment?.reconciliation || null;

    if (reconciliation && !reconciliation.ok) {
      throw new Error("commercial_reconciliation_failed_before_snapshot");
    }

    return {
      schemaVersion: 2,
      code,
      createdAt: new Date().toISOString(),
      versions: suggestion?.versions || ENGINE_VERSIONS,
      clientName: clientName.trim(),
      phone,
      eventDate,
      eventDateLabel: formatDate(eventDate),
      eventType: selectedEvent,
      eventLabel: eventData?.label || "Evento",
      adults,
      olderChildren,
      children,
      realGuests,
      equivalentGuests,
      duration,
      totalCarts: suggestion?.carts.totalCarts || 0,
      preparers: suggestion?.preparers || 0,
      waiters: suggestion?.waiters.quantity || 0,
      includeDisposables,
      investment: suggestion?.investment || {},
      investmentTotal: suggestion?.investment.total || 0,
      consignmentTotal,
      items: finalItems,
      recommendationOriginal: initialRecommendationSnapshot,
      changesFromRecommendation: changes,
      commercialLedger: ledger,
      commercialReconciliation: reconciliation,
      logoUrl: new URL(rodaFestaLogo, window.location.href).href,
    };
  }

  async function submitInternalCopy(snapshot) {
    try {
      window.localStorage.setItem(`roda-festa-proposal-${snapshot.code}`, JSON.stringify(snapshot));
    } catch {
      // O snapshot em memória continua sendo usado para o PDF.
    }

    try {
      const response = await fetch("/api/planning-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!response.ok) throw new Error("internal-copy-unavailable");
      return true;
    } catch {
      return false;
    }
  }

  async function finalizePlanning() {
    if (!suggestion || submitStatus === "sending") return;
    setSubmitStatus("sending");
    setSubmitMessage("Registrando sua proposta…");

    const code = planningCode || createPlanningCode();
    if (!planningCode) setPlanningCode(code);
    const snapshot = buildSnapshot(code);
    const internalCopySent = await submitInternalCopy(snapshot);

    setSubmitStatus(internalCopySent ? "sent" : "local-only");
    setSubmitMessage(internalCopySent
      ? "Proposta registrada e validada comercialmente. A via documental canônica ainda será consolidada na próxima fase."
      : "Proposta pronta. A cópia local foi preservada; o envio interno precisa da integração de e-mail da produção.");
    goTo(5);
  }

  function openPdf() {
    const code = planningCode || createPlanningCode();
    if (!planningCode) setPlanningCode(code);
    const snapshot = buildSnapshot(code);
    const proposalHtml = buildProposalHtml(snapshot);
    const proposalBlob = new Blob([proposalHtml], { type: "text/html;charset=utf-8" });
    const proposalUrl = URL.createObjectURL(proposalBlob);
    const proposalWindow = window.open(proposalUrl, "_blank");
    if (!proposalWindow) {
      URL.revokeObjectURL(proposalUrl);
      setSubmitMessage("Seu navegador bloqueou a proposta. Autorize pop-ups e tente novamente.");
      return;
    }
    proposalWindow.opener = null;
    window.setTimeout(() => URL.revokeObjectURL(proposalUrl), 60000);
  }

  function openWhatsApp() {
    const code = planningCode || "planejamento em andamento";
    const message = encodeURIComponent(`Olá! Concluí meu planejamento no Roda Festa Planner.\n\nCódigo: ${code}\nCliente: ${clientName.trim()}\nEvento: ${eventData?.label || "Evento"}\nData: ${formatDate(eventDate)}\nConvidados: ${realGuests}\nInvestimento estimado: ${formatCurrency(suggestion?.investment.total || 0)}\n\nGostaria de solicitar a revisão da proposta.`);
    window.open(`https://wa.me/5514998960208?text=${message}`, "_blank", "noopener,noreferrer");
  }

  function restart() {
    setClientName(""); setPhone(""); setEventDate(""); setSelectedEvent("");
    setAdults(0); setOlderChildren(0); setChildren(0); setDuration(4);
    setIncludeWaiters(false); setIncludeDisposables(false); setSelectedProductIds([]);
    setExpandedCategory(""); setSuggestion(null); setInitialRecommendationSnapshot(null); setPlanningCode("");
    setSubmitStatus("idle"); setSubmitMessage(""); setFormNotice(""); setEditingCategory(""); setReplacingItemId(""); setErrors({}); goTo(0);
  }

  const groupedSuggestion = CATEGORY_ORDER.map((category) => ({
    category,
    items: (suggestion?.items || []).filter((item) => item.commercialCategory === category),
  })).filter((group) => group.items.length > 0);

  return (
    <main className="rf-planner-v19">
      {stepIndex === 0 ? (
        <section className="rf-welcome rf-welcome--classic">
          <div className="rf-welcome__ambient" aria-hidden="true" />
          <form className="rf-welcome__book" onSubmit={(event) => { event.preventDefault(); if (validateWelcome()) goTo(1); }}>
            <div className="rf-welcome__spine" aria-hidden="true" />
            <div className="rf-welcome__cover">
              <div className="rf-welcome__ornament" aria-hidden="true">✦</div>
              <img className="rf-welcome__logo-classic" src={rodaFestaLogoCreme} alt="Roda Festa" />
              <span className="rf-welcome__kicker">Gastronomia que encanta</span>
              <div className="rf-welcome__title-classic">
                <h1><strong>Meu</strong><em>Planejamento</em></h1>
                <p>Toda grande festa começa com um bom planejamento.</p>
              </div>
              {formNotice && <div className="rf-welcome__notice" role="alert">{formNotice.replace("Antes de seguir: ", "")}</div>}
              <div className="rf-welcome__fields">
                <label><span>Nome</span><input value={clientName} autoComplete="name" placeholder="Como podemos chamar você?" onChange={(event) => { setClientName(event.target.value); setErrors((current) => ({ ...current, clientName: "" })); }} />{errors.clientName && <small>{errors.clientName}</small>}</label>
                <label><span>Telefone</span><input type="tel" value={phone} autoComplete="tel" inputMode="tel" placeholder="(00) 00000-0000" onChange={(event) => { setPhone(event.target.value); setErrors((current) => ({ ...current, phone: "" })); }} />{errors.phone && <small>{errors.phone}</small>}</label>
                <label><span>Data do evento</span><input type="date" min={getToday()} value={eventDate} onChange={(event) => handleEventDateChange(event.target.value)} />{errors.eventDate && <small>{errors.eventDate}</small>}</label>
              </div>
              <button type="submit" className="rf-welcome__action"><span>Iniciar meu planejamento</span><b aria-hidden="true">→</b></button>
              <div className="rf-welcome__wheel" aria-hidden="true">✺</div>
              <small className="rf-welcome__edition">Uma experiência criada pela Roda Festa</small>
            </div>
          </form>
        </section>
      ) : (
        <div className="rf-flow-shell">
          <header className="rf-flow-header">
            <button type="button" className="rf-brand-button" onClick={() => goTo(0)} aria-label="Voltar ao início">
              <img src={rodaFestaLogoCreme} alt="Roda Festa" />
              <span><strong>Meu Planner</strong><small>Roda Festa · gastronomia que encanta</small></span>
            </button>
            {stepIndex < 5 && <button type="button" className="rf-quiet-link rf-quiet-link--light" onClick={restart}>Recomeçar</button>}
          </header>

          <Progress stepIndex={stepIndex} />

          {stepIndex === 1 && (
            <section className="rf-screen">
              <div className="rf-screen__heading"><span className="rf-eyebrow">Agora, o evento</span><h1>Conte como será a sua festa.</h1><p>Escolha a ocasião, informe os convidados e o tempo de atendimento.</p></div>
              {formNotice && <div className="rf-validation-banner" role="alert"><strong>Falta só um detalhe.</strong><span>{formNotice.replace("Antes de seguir: ", "")}</span></div>}

              <div className="rf-section-block"><div className="rf-section-block__title"><span>Tipo de evento</span><h2>Qual será a ocasião?</h2></div><div className="rf-event-grid">{EVENT_OPTIONS.map((event) => <button type="button" key={event.id} className={`rf-choice-card ${selectedEvent === event.id ? "is-selected" : ""}`} onClick={() => setSelectedEvent(event.id)}><span className="rf-choice-card__check">{selectedEvent === event.id ? "✓" : ""}</span><strong>{event.label}</strong><small>{event.description}</small></button>)}</div>{errors.selectedEvent && <small className="rf-error rf-error--block">{errors.selectedEvent}</small>}</div>

              <div className="rf-section-block"><div className="rf-section-block__title"><span>Convidados</span><h2>Quantas pessoas participarão?</h2></div><div className="rf-card rf-counter-stack"><Counter label="Adultos" hint="Consumo integral" value={adults} onChange={setAdults} /><Counter label="Crianças 7+" hint="Equivalem a 1 adulto" value={olderChildren} onChange={setOlderChildren} /><Counter label="Crianças 0–6" hint="Equivalem a 0,5 adulto" value={children} onChange={setChildren} /></div><div className="rf-equivalent"><span>{realGuests} convidados reais</span><strong>{equivalentGuests.toLocaleString("pt-BR")} equivalentes para o cálculo</strong></div>{errors.guests && <small className="rf-error rf-error--block">{errors.guests}</small>}</div>

              <div className="rf-section-block"><div className="rf-section-block__title"><span>Duração</span><h2>Quanto tempo de atendimento?</h2></div><label className="rf-field rf-field--select"><select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{[4,5,6,7,8].map((hours) => <option key={hours} value={hours}>{hours} horas</option>)}</select></label></div>

              <div className="rf-sticky-action"><button type="button" className="rf-primary" onClick={() => { if (validateInfo()) goTo(2); }}>Escolher cardápio <span>→</span></button></div>
            </section>
          )}

          {stepIndex === 2 && (
            <section className="rf-screen">
              <div className="rf-screen__heading"><span className="rf-eyebrow">Agora, o cardápio</span><h1>O que você quer servir?</h1><p>Escolha os sabores. O Planner calcula as quantidades depois.</p></div>
              <div className="rf-category-list">{categories.map((category) => {
                const selectedCount = category.products.filter((product) => selectedProductIds.includes(product.id)).length;
                const isOpen = expandedCategory === category.id;
                return <article className={`rf-category ${isOpen ? "is-open" : ""}`} key={category.id}>
                  <button type="button" className="rf-category__header" onClick={() => setExpandedCategory(isOpen ? "" : category.id)}><div><strong>{category.title}</strong><span>{selectedCount > 0 ? `${selectedCount} selecionado${selectedCount > 1 ? "s" : ""}` : category.subtitle}</span></div><b>{isOpen ? "−" : "+"}</b></button>
                  {isOpen && <div className="rf-category__products">{category.products.map((product) => {
                    const selected = selectedProductIds.includes(product.id);
                    return <button type="button" key={product.id} className={`rf-product-choice ${selected ? "is-selected" : ""}`} onClick={() => toggleProduct(product.id)}><span className="rf-product-choice__tick">{selected ? "✓" : "+"}</span><div><strong>{product.name}</strong>{product.description && <small>{product.description}</small>}<em>{getPriceLabel(product)}{product.consignment ? " · consignação" : ""}</em></div></button>;
                  })}</div>}
                </article>;
              })}</div>
              {errors.menu && <small className="rf-error rf-error--block">{errors.menu}</small>}
              <div className="rf-selection-summary"><span>{selectedProductIds.length} {selectedProductIds.length === 1 ? "item escolhido" : "itens escolhidos"}</span><small>Você poderá ajustar as quantidades na próxima etapa.</small></div>
              <div className="rf-sticky-action rf-sticky-action--split"><button type="button" className="rf-secondary" onClick={() => goTo(1)}>Voltar</button><button type="button" className="rf-primary" onClick={generateSuggestionAndContinue}>Calcular meu evento <span>→</span></button></div>
            </section>
          )}

          {stepIndex === 3 && suggestion && (
            <section className="rf-screen">
              <div className="rf-screen__heading"><span className="rf-eyebrow">Sua recomendação</span><h1>Agora o evento ganhou forma.</h1><p>Veja a estrutura sugerida e faça os ajustes que desejar. Esta tela é só para isso.</p></div>

              <div className="rf-scene-card">
                <div className="rf-scene-card__meta"><div><span>Estrutura sugerida</span><strong>{suggestion.carts.totalCarts} {suggestion.carts.totalCarts === 1 ? "carrinho" : "carrinhos"}</strong></div><div><span>Investimento atual</span><strong>{formatCurrency(suggestion.investment.total)}</strong></div></div>
                <div className={`rf-scene rf-scene--${sceneObjects.length}`}>{sceneObjects.map((object) => <figure key={object.id} className={object.table ? "is-table" : ""}><img src={object.src} alt={object.label} /><figcaption>{object.label}</figcaption></figure>)}</div>
              </div>

              <div className="rf-section-block">
                <div className="rf-section-block__title">
                  <span>Personalização completa</span>
                  <h2>Deixe a festa do seu jeito</h2>
                  <p>A recomendação é um ponto de partida: aumente quantidades, troque sabores, adicione itens ou categorias e retire o que não quiser.</p>
                </div>
                <div className="rf-adjust-list">
                  {groupedSuggestion.map((group) => {
                    const categoryProducts = PRODUCT_CATALOG.filter((product) => product.active && product.commercialCategory === group.category);
                    const availableProducts = categoryProducts.filter((product) => !group.items.some((item) => item.id === product.id));
                    const isEditing = editingCategory === group.category;
                    return (
                      <div className="rf-adjust-group" key={group.category}>
                        <div className="rf-adjust-group__head">
                          <div><span>Categoria</span><h3>{group.category === "Bebidas" ? "Bebidas · consignação" : group.category}</h3></div>
                          <div className="rf-adjust-group__actions">
                            <button type="button" onClick={() => { setEditingCategory(isEditing ? "" : group.category); setReplacingItemId(""); }}>{isEditing ? "Fechar" : "+ Adicionar / trocar"}</button>
                            <button type="button" className="is-danger" onClick={() => removeCategoryFromSuggestion(group.category)}>Retirar categoria</button>
                          </div>
                        </div>
                        {group.items.map((item) => {
                          const lot = Number(item.lotSize) || 1;
                          return (
                            <article className="rf-adjust-item" key={item.id}>
                              <div className="rf-adjust-item__copy"><strong>{item.name}</strong><span>{getPriceLabel(item)}</span></div>
                              <div className="rf-adjust-item__control"><button type="button" onClick={() => changeItemQuantity(item.id, Number(item.quantity) - lot)}>−</button><input type="number" min="0" step={lot} value={item.quantity} onChange={(event) => changeItemQuantity(item.id, event.target.value)} /><button type="button" onClick={() => changeItemQuantity(item.id, Number(item.quantity) + lot)}>+</button></div>
                              <div className="rf-adjust-item__value"><span>{getQuantityLabel(item)}</span><strong>{item.consignment ? "Consignação" : formatCurrency(getItemValue(item))}</strong></div>
                              <div className="rf-adjust-item__actions"><button type="button" onClick={() => { setEditingCategory(group.category); setReplacingItemId(item.id); }}>Trocar sabor</button><button type="button" className="is-danger" onClick={() => removeItemFromSuggestion(item.id)}>Retirar item</button></div>
                            </article>
                          );
                        })}
                        {isEditing && (
                          <div className="rf-edit-drawer">
                            <div className="rf-edit-drawer__title"><strong>{replacingItemId ? "Escolha o novo item" : "Acrescente outro item"}</strong><small>{replacingItemId ? "A quantidade atual será preservada e ajustada ao lote do novo produto." : "O Planner sugere a quantidade inicial e recalcula toda a estrutura."}</small></div>
                            <div className="rf-edit-drawer__grid">
                              {availableProducts.length > 0 ? availableProducts.map((product) => <button type="button" key={product.id} onClick={() => replacingItemId ? replaceSuggestionItem(replacingItemId, product) : addProductToSuggestion(product)}><strong>{product.name}</strong><span>{getPriceLabel(product)}</span></button>) : <p>Todos os itens desta categoria já estão no planejamento.</p>}
                            </div>
                            {replacingItemId && <button type="button" className="rf-text-button" onClick={() => setReplacingItemId("")}>Cancelar troca</button>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="rf-add-category">
                  <div><span>Quer ampliar o evento?</span><h3>Adicionar outra categoria</h3><p>Inclua uma categoria que ainda não faz parte da recomendação.</p></div>
                  <div className="rf-add-category__grid">
                    {categories.filter((category) => !(suggestion.items || []).some((item) => item.commercialCategory === category.commercialCategory)).map((category) => (
                      <button type="button" key={category.id} onClick={() => { setEditingCategory(category.commercialCategory); setReplacingItemId(""); const firstProduct = category.products[0]; if (firstProduct) addProductToSuggestion(firstProduct); }}>
                        <strong>+ {category.title}</strong><span>{category.subtitle}</span>
                      </button>
                    ))}
                    {categories.every((category) => (suggestion.items || []).some((item) => item.commercialCategory === category.commercialCategory)) && <small>Todas as categorias disponíveis já estão no planejamento.</small>}
                  </div>
                </div>
              </div>

              <div className="rf-section-block"><div className="rf-section-block__title"><span>Serviços opcionais</span><h2>Deseja apoio adicional?</h2></div><div className="rf-toggle-stack"><label className="rf-toggle-card"><div><strong>Garçons</strong><span>1 profissional para cada 20 convidados reais.</span></div><input type="checkbox" checked={includeWaiters} onChange={(event) => syncOptionalServices(event.target.checked, includeDisposables)} /></label><label className="rf-toggle-card"><div><strong>Descartáveis</strong><span>Kit dimensionado automaticamente para o evento.</span></div><input type="checkbox" checked={includeDisposables} onChange={(event) => syncOptionalServices(includeWaiters, event.target.checked)} /></label></div></div>

              <div className="rf-cost-card"><div><span>Produtos</span><strong>{formatCurrency(suggestion.investment.productsValue)}</strong></div><div><span>Estrutura · {suggestion.investment.chargedTotalCarts ?? suggestion.carts.totalCarts} carrinhos</span><strong>{formatCurrency(suggestion.investment.cartsValue)}</strong></div>{suggestion.investment.additionalHoursValue > 0 && <div><span>Horas adicionais</span><strong>{formatCurrency(suggestion.investment.additionalHoursValue)}</strong></div>}{suggestion.investment.waitersValue > 0 && <div><span>Garçons</span><strong>{formatCurrency(suggestion.investment.waitersValue)}</strong></div>}{suggestion.investment.disposablesValue > 0 && <div><span>Descartáveis</span><strong>{formatCurrency(suggestion.investment.disposablesValue)}</strong></div>}<div className="rf-cost-card__total"><span>Investimento contratado</span><strong>{formatCurrency(suggestion.investment.total)}</strong></div>{consignmentTotal > 0 && <small>+ estimativa de {formatCurrency(consignmentTotal)} em bebidas por consignação.</small>}</div>

              <div className="rf-sticky-action rf-sticky-action--split"><button type="button" className="rf-secondary" onClick={() => goTo(2)}>Cardápio</button><button type="button" className="rf-primary" onClick={() => { if ((suggestion.items || []).length === 0) { setFormNotice("Adicione pelo menos um item antes de validar a proposta."); return; } goTo(4); }}>Validar proposta <span>→</span></button></div>
            </section>
          )}

          {stepIndex === 4 && suggestion && (
            <section className="rf-screen">
              <div className="rf-screen__heading"><span className="rf-eyebrow">Última conferência</span><h1>Confira antes de concluir.</h1><p>Nesta etapa nada disputa sua atenção: apenas o que será enviado para a proposta.</p></div>

              <div className="rf-review-hero"><div><span>{eventData?.label}</span><h2>{clientName.trim()}</h2><p>{formatDate(eventDate)} · {duration} horas</p></div><span className="rf-review-hero__badge">{realGuests} convidados</span></div>

              <div className="rf-review-grid"><div className="rf-review-card"><span>Convidados</span><strong>{adults} adultos</strong><p>{olderChildren} crianças 7+ · {children} crianças 0–6</p><small>{equivalentGuests.toLocaleString("pt-BR")} equivalentes no cálculo</small></div><div className="rf-review-card"><span>Estrutura</span><strong>{suggestion.carts.totalCarts} {suggestion.carts.totalCarts === 1 ? "carrinho" : "carrinhos"}</strong><p>{suggestion.preparers} {suggestion.preparers === 1 ? "profissional de preparo" : "profissionais de preparo"}</p>{suggestion.waiters.quantity > 0 && <small>+ {suggestion.waiters.quantity} {suggestion.waiters.quantity === 1 ? "garçom" : "garçons"}</small>}</div></div>

              <div className="rf-review-menu">{groupedSuggestion.map((group) => <section key={group.category}><h3>{group.category === "Bebidas" ? "Bebidas em consignação" : group.category}</h3>{group.items.map((item) => <div key={item.id}><span>{item.name}</span><strong>{getQuantityLabel(item)}</strong></div>)}</section>)}</div>

              <div className="rf-final-money"><span>Investimento contratado</span><strong>{formatCurrency(suggestion.investment.total)}</strong><p>Bebidas em consignação são cobradas posteriormente, apenas pelo consumo.</p>{consignmentTotal > 0 && <small>Estimativa de consignação: {formatCurrency(consignmentTotal)}</small>}</div>

              <div className="rf-terms-mini"><p><strong>Reserva:</strong> {COMMERCIAL_TERMS.reservation}</p><p><strong>Saldo:</strong> {COMMERCIAL_TERMS.balance}</p><p><strong>Validade:</strong> {COMMERCIAL_TERMS.validity}</p></div>

              <div className="rf-sticky-action rf-sticky-action--split"><button type="button" className="rf-secondary" onClick={() => goTo(3)}>Ajustar</button><button type="button" className="rf-primary" disabled={submitStatus === "sending"} onClick={finalizePlanning}>{submitStatus === "sending" ? "Registrando…" : "Concluir planejamento"} <span>→</span></button></div>
            </section>
          )}

          {stepIndex === 5 && suggestion && (
            <section className="rf-complete">
              <div className="rf-complete__mark">✓</div><span className="rf-eyebrow">Planejamento concluído</span><h1>Pronto, {clientName.trim().split(" ")[0]}.</h1><p>Seu planejamento foi fechado em uma versão única. O PDF nasce exatamente desses dados.</p>
              <div className="rf-code-card"><span>Código do planejamento</span><strong>{planningCode}</strong></div>
              <div className="rf-complete__money"><span>Investimento contratado</span><strong>{formatCurrency(suggestion.investment.total)}</strong>{consignmentTotal > 0 && <small>Consignação estimada: {formatCurrency(consignmentTotal)}</small>}</div>
              {submitMessage && <div className={`rf-submit-status rf-submit-status--${submitStatus}`}>{submitMessage}</div>}
              <div className="rf-complete__actions"><button type="button" className="rf-primary" onClick={openPdf}>Gerar meu PDF</button><button type="button" className="rf-secondary rf-secondary--wide" onClick={openWhatsApp}>Enviar para a especialista pelo WhatsApp</button></div>
              <button type="button" className="rf-quiet-link rf-quiet-link--center" onClick={restart}>Criar outro planejamento</button>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
