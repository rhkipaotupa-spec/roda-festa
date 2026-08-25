const MONEY_PRECISION = 100;

function money(value) {
  return Math.round((Number(value) || 0) * MONEY_PRECISION) / MONEY_PRECISION;
}

function assertNonNegativeNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`invalid_${label}`);
  }
  return number;
}

export function buildCommercialLedger({
  items = [],
  totalCarts = 0,
  serviceHours,
  waiters = { quantity: 0, value: 0 },
  disposables = { included: false, value: 0 },
  parameters,
}) {
  if (!parameters?.service) throw new Error("missing_commercial_parameters");

  const includedHours = assertNonNegativeNumber(parameters.service.includedHours, "included_hours");
  const cartBasePrice = assertNonNegativeNumber(parameters.service.cartBasePrice, "cart_base_price");
  const additionalHourPerCart = assertNonNegativeNumber(parameters.service.additionalHourPerCart, "additional_hour_price");
  const maxCarts = assertNonNegativeNumber(parameters.service.maxCarts, "max_carts");
  const chargedTotalCarts = Math.max(0, Math.min(Number(totalCarts) || 0, maxCarts));
  const normalizedServiceHours = Math.max(includedHours, Number(serviceHours) || includedHours);
  const additionalHours = Math.max(0, normalizedServiceHours - includedHours);

  const contractedLines = [];
  const consignmentLines = [];

  for (const item of items) {
    const quantity = assertNonNegativeNumber(item.quantity || 0, `quantity_${item.id || "item"}`);
    const unitPrice = assertNonNegativeNumber(item.unitPrice || 0, `unit_price_${item.id || "item"}`);
    const subtotal = money(quantity * unitPrice);
    const line = {
      id: `product:${item.id}`,
      type: "product",
      productId: item.id,
      category: item.commercialCategory || "",
      label: item.name || item.id,
      quantity,
      unitPrice: money(unitPrice),
      subtotal,
      consignment: Boolean(item.consignment),
    };

    if (item.consignment) consignmentLines.push(line);
    else contractedLines.push(line);
  }

  if (chargedTotalCarts > 0) {
    contractedLines.push({
      id: "service:carts",
      type: "carts",
      label: "Carrinhos - pacote base",
      quantity: chargedTotalCarts,
      unitPrice: money(cartBasePrice),
      subtotal: money(chargedTotalCarts * cartBasePrice),
      consignment: false,
    });
  }

  if (additionalHours > 0 && chargedTotalCarts > 0) {
    contractedLines.push({
      id: "service:additional-hours",
      type: "additional_hours",
      label: "Horas adicionais dos carrinhos",
      quantity: additionalHours * chargedTotalCarts,
      unitPrice: money(additionalHourPerCart),
      subtotal: money(additionalHours * chargedTotalCarts * additionalHourPerCart),
      metadata: { additionalHours, chargedTotalCarts },
      consignment: false,
    });
  }

  const waitersQuantity = Math.max(0, Number(waiters?.quantity) || 0);
  const waitersValue = money(Math.max(0, Number(waiters?.value) || 0));
  if (waitersValue > 0) {
    contractedLines.push({
      id: "service:waiters",
      type: "waiters",
      label: "Garçons",
      quantity: waitersQuantity,
      unitPrice: waitersQuantity > 0 ? money(waitersValue / waitersQuantity) : waitersValue,
      subtotal: waitersValue,
      consignment: false,
    });
  }

  const disposablesValue = money(Math.max(0, Number(disposables?.value) || 0));
  if (disposables?.included && disposablesValue > 0) {
    contractedLines.push({
      id: "service:disposables",
      type: "disposables",
      label: "Descartáveis",
      quantity: 1,
      unitPrice: disposablesValue,
      subtotal: disposablesValue,
      consignment: false,
    });
  }

  const contractedTotal = money(contractedLines.reduce((sum, line) => sum + line.subtotal, 0));
  const consignmentEstimate = money(consignmentLines.reduce((sum, line) => sum + line.subtotal, 0));
  const productsValue = money(contractedLines.filter((line) => line.type === "product").reduce((sum, line) => sum + line.subtotal, 0));
  const cartsValue = money(contractedLines.filter((line) => line.type === "carts").reduce((sum, line) => sum + line.subtotal, 0));
  const additionalHoursValue = money(contractedLines.filter((line) => line.type === "additional_hours").reduce((sum, line) => sum + line.subtotal, 0));

  return {
    schemaVersion: 1,
    contractedLines,
    consignmentLines,
    totals: {
      productsValue,
      cartsValue,
      additionalHoursValue,
      waitersValue,
      disposablesValue,
      contractedTotal,
      consignmentEstimate,
    },
    structure: {
      chargedTotalCarts,
      includedHours,
      serviceHours: normalizedServiceHours,
      additionalHours,
    },
  };
}

export function reconcileCommercialLedger(ledger, expectedTotal) {
  const lineTotal = money((ledger?.contractedLines || []).reduce((sum, line) => sum + (Number(line.subtotal) || 0), 0));
  const ledgerTotal = money(ledger?.totals?.contractedTotal || 0);
  const expected = expectedTotal == null ? ledgerTotal : money(expectedTotal);
  const ledgerDifference = money(lineTotal - ledgerTotal);
  const expectedDifference = money(lineTotal - expected);

  return {
    ok: ledgerDifference === 0 && expectedDifference === 0,
    lineTotal,
    ledgerTotal,
    expectedTotal: expected,
    ledgerDifference,
    expectedDifference,
  };
}
