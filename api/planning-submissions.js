const MAX_BODY_BYTES = 150_000;

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

function buildEmail(snapshot) {
  const rows = (snapshot.items || []).map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${htmlEscape(item.commercialCategory)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${htmlEscape(item.name)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${htmlEscape(item.quantityLabel)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${htmlEscape(item.consignment ? "Consignação" : money(item.estimatedValue))}</td>
    </tr>`).join("");

  return `
  <div style="font-family:Arial,sans-serif;color:#3f2a22;max-width:760px;margin:auto">
    <h1 style="color:#5d2022">Nova proposta Roda Festa</h1>
    <p><strong>${htmlEscape(snapshot.code)}</strong> · ${htmlEscape(snapshot.clientName)} · ${htmlEscape(snapshot.eventLabel)} · ${htmlEscape(snapshot.eventDateLabel)}</p>
    <p>${snapshot.realGuests} convidados · ${snapshot.totalCarts} carrinhos · ${snapshot.duration} horas</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <thead><tr><th align="left">Categoria</th><th align="left">Item</th><th align="right">Quantidade</th><th align="right">Valor</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="background:#5d2022;color:white;padding:18px;border-radius:12px">
      <div>Investimento contratado</div><strong style="font-size:26px">${htmlEscape(money(snapshot.investmentTotal))}</strong>
      <div style="margin-top:8px">Consignação estimada: ${htmlEscape(money(snapshot.consignmentTotal))}</div>
    </div>
    <p style="font-size:12px;color:#806b61;margin-top:18px">Esta via interna foi gerada do mesmo snapshot usado para o PDF do cliente. Os preços unitários e quantidades ficam preservados neste registro.</p>
  </div>`;
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

  const snapshot = request.body || {};
  if (!snapshot.code || !snapshot.clientName || !Array.isArray(snapshot.items)) {
    return response.status(400).json({ error: "invalid_snapshot" });
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
    return response.status(201).json({ ok: true, id: result.id });
  } catch (error) {
    console.error("proposal_delivery_exception", error);
    return response.status(500).json({ error: "proposal_delivery_exception" });
  }
}
