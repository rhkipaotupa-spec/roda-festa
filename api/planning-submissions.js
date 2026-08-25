import {
  ENGINE_VERSIONS,
  PRODUCTS,
  calculateCarts,
  calculateDisposables,
  calculateInvestment,
  calculateWaiters,
} from "../src/planner/planning-book/engine/planningRules.js";

const MAX_BODY_BYTES = 150_000;
const MAX_ITEM_QUANTITY = 10_000;
const PRODUCT_BY_ID = new Map(Object.values(PRODUCTS).map((product) => [product.id, product]));

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function buildEmail(snapshot) {
  const productRows = (snapshot.commercialLedger?.contractedLines || [])
    .filter((line) => line.type === "product")
    .map((line) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${htmlEscape(line.category)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">${htmlEscape(line.label)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${htmlEscape(line.quantity)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${htmlEscape(money(line.unitPrice))}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${htmlEscape(money(line.subtotal))}</td>
      </tr>`)
    .join("");

  const serviceRows = (snapshot.commercialLedger?.contractedLines || [])
    .filter((line) => line.type !== "product")
    .map((line) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee" colspan="2">${htmlEscape(line.label)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${htmlEscape(line.quantity)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${htmlEscape(money(line.unitPrice))}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${htmlEscape(money(line.subtotal))}</td>
      </tr>`)
    .join("");

  const changeRows = (snapshot.changesFromRecommendation || []).map((change) => {
    const product = PRODUCT_BY_ID.get(change.productId);
    const label = product?.name || change.productId;
    return `<li><strong>${htmlEscape(change.type)}</strong> · ${htmlEscape(label)} · ${htmlEscape(change.before)} → ${htmlEscape(change.after)}</li>`;
  }).join("");

  return `
  <div style="font-family:Arial,sans-serif;color:#3f2a22;max-width:820px;margin:auto">
    <h1 style="color:#5d2022">Nova proposta Roda Festa</h1>
    <p><strong>${htmlEscape(snapshot.code)}</strong> · ${htmlEscape(snapshot.clientName)} · ${htmlEscape(snapshot.eventLabel)} · ${htmlEscape(snapshot.eventDateLabel)}</p>
    <p>${snapshot.realGuests} convidados · ${snapshot.totalCarts} carrinhos · ${snapshot.duration} horas</p>
    <p style="font-size:12px;color:#806b61">Motor ${htmlEscape(snapshot.versions?.recommendation)} · Regras ${htmlEscape(snapshot.versions?.commercialRules)} · Tabela ${htmlEscape(snapshot.versions?.priceBook)}</p>
    <h2>Reconciliação financeira interna</h2>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <thead><tr><th align="left">Categoria</th><th align="left">Item</th><th align="right">Qtd.</th><th align="right">Unitário</th><th align="right">Subtotal</th></tr></thead>
      <tbody>${productRows}${serviceRows}</tbody>
    </table>
    <div style="background:#5d2022;color:white;padding:18px;border-radius:12px">
      <div>Investimento contratado reconciliado</div><strong style="font-size:26px">${htmlEscape(money(snapshot.investmentTotal))}</strong>
      <div style="margin-top:8px">Consignação estimada: ${htmlEscape(money(snapshot.consignmentTotal))}</div>
      <div style="margin-top:8px">Diferença de reconciliação: ${htmlEscape(money(snapshot.commercialReconciliation?.expectedDifference || 0))}</div>
    </div>
    <h2>Comparação com a recomendação original</h2>
    <p>${(snapshot.changesFromRecommendation || []).length} alteração(ões) comercialmente relevante(s) entre a sugestão inicial e a proposta final.</p>
    ${changeRows ? `<ul>${changeRows}</ul>` : "<p>Nenhuma alteração de item/quantidade detectada.</p>"}
    <p style="font-size:12px;color:#806b61">Nesta fase, a recomendação original ainda é capturada no navegador. A próxima fundação moverá esse histórico para PlanningSession server-side.</p>
    <p style="font-size:12px;color:#806b61;margin-top:18px">Os valores desta via foram recalculados no servidor usando catálogo e regras comerciais confiáveis. O frontend não é autoridade do preço oficial.</p>
  </div>`;
}

export function normalizeEventDate(value, now = new Date()) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const businessToday = `${byType.year}-${byType.month}-${byType.day}`;
  return value >= businessToday ? value : null;
}

export function rebuildAuthoritativeSnapshot(snapshot) {
  const adults = Math.max(0, Number(snapshot.adults) || 0);
  const olderChildren = Math.max(0, Number(snapshot.olderChildren) || 0);
  const children = Math.max(0, Number(snapshot.children) || 0);
  const realGuests = adults + olderChildren + children;
  const equivalentGuests = adults + olderChildren + children * 0.5;
  const duration = Math.max(4, Number(snapshot.duration) || 4);

  const items = (snapshot.items || []).map((requestedItem) => {
    const product = PRODUCT_BY_ID.get(requestedItem.id);
    if (!product?.active) throw new Error(`unknown_product:${requestedItem.id}`);
    const quantity = Number(requestedItem.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > MAX_ITEM_QUANTITY) {
      throw new Error(`invalid_quantity:${requestedItem.id}`);
    }
    const lotSize = Number(product.lotSize) || 1;
    if (Math.abs(quantity / lotSize - Math.round(quantity / lotSize)) > Number.EPSILON) {
      throw new Error(`invalid_lot:${requestedItem.id}`);
    }
    return {
      ...product,
      quantity,
      estimatedValue: product.consignment ? 0 : roundMoney(quantity * product.unitPrice),
    };
  });

  const carts = calculateCarts({ items, serviceHours: duration, equivalentGuests });
  const waiters = calculateWaiters({ realGuests, includeWaiters: Number(snapshot.waiters) > 0 });
  const disposables = calculateDisposables({ equivalentGuests, includeDisposables: Boolean(snapshot.includeDisposables) });
  const investment = calculateInvestment({ items, totalCarts: carts.totalCarts, serviceHours: duration, waiters, disposables });
  const consignmentTotal = roundMoney(investment.ledger.totals.consignmentEstimate);

  const clientTotal = roundMoney(snapshot.investmentTotal);
  const serverTotal = roundMoney(investment.total);
  if (clientTotal !== serverTotal) throw new Error(`commercial_total_mismatch:${clientTotal}:${serverTotal}`);
  if (Number(snapshot.totalCarts) !== carts.totalCarts) throw new Error(`commercial_cart_mismatch:${snapshot.totalCarts}:${carts.totalCarts}`);

  return {
    ...snapshot,
    schemaVersion: 3,
    serverValidatedAt: new Date().toISOString(),
    versions: { ...ENGINE_VERSIONS },
    adults,
    olderChildren,
    children,
    realGuests,
    equivalentGuests,
    duration,
    totalCarts: carts.totalCarts,
    waiters: waiters.quantity,
    investment,
    investmentTotal: serverTotal,
    consignmentTotal,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      commercialCategory: item.commercialCategory,
      operationalGroup: item.operationalGroup,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      priceUnit: item.priceUnit || "unit",
      consignment: Boolean(item.consignment),
      estimatedValue: item.estimatedValue,
    })),
    commercialLedger: investment.ledger,
    commercialReconciliation: investment.reconciliation,
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "method_not_allowed" });

  const apiKey = process.env.RESEND_API_KEY;
  const destination = process.env.RODA_FESTA_PROPOSAL_EMAIL;
  const from = process.env.RODA_FESTA_FROM_EMAIL || "Roda Festa Planner <onboarding@resend.dev>";

  if (!apiKey || !destination) {
    return response.status(503).json({ error: "proposal_delivery_not_configured" });
  }

  const raw = JSON.stringify(request.body || {});
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return response.status(413).json({ error: "payload_too_large" });

  const submitted = request.body || {};
  if (!submitted.code || !submitted.clientName || !Array.isArray(submitted.items) || !normalizeEventDate(submitted.eventDate)) {
    return response.status(400).json({ error: "invalid_snapshot" });
  }

  let snapshot;
  try {
    snapshot = rebuildAuthoritativeSnapshot(submitted);
  } catch (error) {
    console.error("proposal_commercial_validation_failed", error?.message || error);
    return response.status(409).json({ error: "commercial_validation_failed" });
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [destination],
        subject: `Roda Festa · ${snapshot.code} · ${snapshot.clientName}`,
        html: buildEmail(snapshot),
      }),
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text();
      console.error("proposal_delivery_failed", resendResponse.status, detail.slice(0, 500));
      return response.status(502).json({ error: "proposal_delivery_failed" });
    }

    const result = await resendResponse.json();
    return response.status(201).json({
      ok: true,
      id: result.id,
      authoritativeTotal: snapshot.investmentTotal,
      reconciliation: snapshot.commercialReconciliation,
      versions: snapshot.versions,
    });
  } catch (error) {
    console.error("proposal_delivery_exception", error);
    return response.status(500).json({ error: "proposal_delivery_exception" });
  }
}
