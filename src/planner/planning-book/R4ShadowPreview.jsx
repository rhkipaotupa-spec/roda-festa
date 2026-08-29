import { useState } from "react";
import { Link } from "react-router-dom";

import "./R4ShadowPreview.css";

import { PRODUCTS } from "./engine/planningRules";
import {
  R4_PARAMETERS,
  generateR4ShadowRecommendation,
} from "./engine/shadowRecommendationR4";
import { allocateR4ShadowSkus } from "./engine/shadowR4SkuAllocation";
import { buildR4ShadowCommercialPreview } from "./engine/shadowR4CommercialPreview";

import rodaFestaLogoCreme from "./assets/logo-roda-festa-creme.png";

const PRODUCT_CATALOG = Object.values(PRODUCTS);

const SOLID_OPTIONS = [
  { id: "Petiscos", title: "Salgadinhos fritos", note: "6,5 un./adulto no menu completo; corredor de massa como guarda." },
  { id: "Mini lanches", title: "Mini lanches", note: "M = 1,5 e M* = 2 por adulto equivalente." },
  { id: "Tortas", title: "Tortas", note: "70 g com 1 sabor; variedade satura em 2+ sabores." },
  { id: "Doces", title: "Doces", note: "5 unidades por adulto equivalente." },
  { id: "Bolos", title: "Bolos", note: "120 g com 1 sabor; 150 g em 2+ sabores." },
];


const SOLID_PRODUCTS_BY_CATEGORY = Object.fromEntries(
  SOLID_OPTIONS.map((option) => [
    option.id,
    PRODUCT_CATALOG.filter(
      (product) => product.active !== false && product.commercialCategory === option.id
    ),
  ])
);

const BEVERAGE_OPTIONS = [
  { id: "agua-mineral", label: "Água mineral", share: "40%" },
  { id: "suco-laranja-200ml", label: "Suco de laranja 200 ml", share: "40%" },
  { id: "refrigerante-200ml", label: "Refrigerante 200 ml", share: "20%" },
];

const QUICK_CASES = [
  {
    id: "petiscos-60",
    label: "60 adultos · só Petiscos",
    state: {
      adults: 60,
      olderChildren: 0,
      children: 0,
      serviceHours: 4,
      selectedSolids: ["Petiscos"],
      selectedSolidProductIds: ["coxinha-frango-catupiry", "bolinha-queijo", "pastel-queijo"],
      externalSolids: [],
      beveragesEnabled: false,
      selectedBeverages: [],
      includeWaiters: false,
      includeDisposables: false,
    },
  },
  {
    id: "b1-70",
    label: "70 convidados · P + Mini + Torta",
    state: {
      adults: 63,
      olderChildren: 1,
      children: 6,
      serviceHours: 4,
      selectedSolids: ["Petiscos", "Mini lanches", "Tortas"],
      selectedSolidProductIds: [
        "coxinha-frango-catupiry",
        "bolinha-queijo",
        "pastel-queijo",
        "mini-hot-dog",
        "torta-frango-catupiry",
        "torta-strogonoff-frango",
      ],
      externalSolids: [],
      beveragesEnabled: false,
      selectedBeverages: [],
      includeWaiters: false,
      includeDisposables: false,
    },
  },
  {
    id: "menu-completo",
    label: "42 convidados · menu completo",
    state: {
      adults: 27,
      olderChildren: 0,
      children: 15,
      serviceHours: 4,
      selectedSolids: ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos"],
      selectedSolidProductIds: [
        "coxinha-frango-catupiry",
        "bolinha-queijo",
        "pastel-queijo",
        "mini-x-burguer",
        "torta-frango-catupiry",
        "brigadeiro-chocolate",
        "bolo-beatriz",
      ],
      externalSolids: [],
      beveragesEnabled: false,
      selectedBeverages: [],
      includeWaiters: false,
      includeDisposables: false,
    },
  },
  {
    id: "compare-pdf-70",
    label: "70 convidados · comparar com PDF",
    state: {
      adults: 55,
      olderChildren: 15,
      children: 0,
      serviceHours: 4,
      selectedSolids: ["Petiscos", "Mini lanches", "Tortas", "Doces", "Bolos"],
      selectedSolidProductIds: [
        "coxinha-frango-catupiry",
        "bolinha-queijo",
        "pastel-queijo",
        "mini-x-burguer",
        "torta-frango-catupiry",
        "brigadeiro-chocolate",
        "bolo-beatriz",
      ],
      externalSolids: [],
      beveragesEnabled: true,
      selectedBeverages: BEVERAGE_OPTIONS.map((item) => item.id),
      includeWaiters: true,
      includeDisposables: true,
    },
  },
];

function formatNumber(value, maximumFractionDigits = 2) {
  return Number(value || 0).toLocaleString("pt-BR", {
    maximumFractionDigits,
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatLiters(ml) {
  return `${formatNumber(Number(ml || 0) / 1000, 2)} L`;
}

function categoryExpectedLabel(category) {
  if (category.naturalUnit === "unit") {
    return `${formatNumber(category.expectedNaturalPerAdult4h, 2)} un./adulto`;
  }
  return `${formatNumber(category.expectedNaturalPerAdult4h, 1)} g/adulto`;
}

function categoryPlannedLabel(category) {
  if (!category.contracted) return "Somente contexto externo";

  if (category.naturalUnit === "unit") {
    const rounded = category.plannedRoundedCategoryUnits ?? category.plannedNaturalQuantity;
    return `${formatNumber(rounded, 0)} un.`;
  }

  if (category.plannedRoundedNominalPortions) {
    return `${formatNumber(category.plannedNaturalQuantity, 0)} g · ${formatNumber(category.plannedRoundedNominalPortions, 0)} porções nominais`;
  }

  return `${formatNumber(category.plannedNaturalQuantity, 0)} g`;
}

function formatAllocationItem(item) {
  if (item.allocationUnit === "nominal-portion") {
    return `${formatNumber(item.quantity, 0)} porcoes · ${formatNumber(Number(item.grams || 0) / 1000, 2)} kg`;
  }
  return `${formatNumber(item.quantity, 0)} un.`;
}

function formatAllocationTarget(category) {
  if (category.target.allocationUnit === "nominal-portion") {
    return `${formatNumber(category.target.plannedNaturalQuantity, 0)} g · ${formatNumber(category.targetCommercialUnits, 0)} porcoes`;
  }
  return `${formatNumber(category.targetCommercialUnits, 0)} un.`;
}

function formatAllocationOverage(category) {
  if (category.status !== "allocated-preview") return "Aguardando SKU";
  if (category.target.allocationUnit === "nominal-portion") {
    const grams = Number(category.overageGrams || 0);
    return grams > 0 ? `+${formatNumber(grams, 0)} g por quantizacao` : "Sem excedente";
  }
  const units = Number(category.overageCommercialUnits || 0);
  return units > 0 ? `+${formatNumber(units, 0)} un. por lote` : "Sem excedente";
}

function stateFromQuickCase(item) {
  return {
    adults: item.adults,
    olderChildren: item.olderChildren,
    children: item.children,
    serviceHours: item.serviceHours,
    selectedSolids: [...item.selectedSolids],
    selectedSolidProductIds: [...item.selectedSolidProductIds],
    externalSolids: [...item.externalSolids],
    beveragesEnabled: item.beveragesEnabled,
    selectedBeverages: [...item.selectedBeverages],
    includeWaiters: Boolean(item.includeWaiters),
    includeDisposables: Boolean(item.includeDisposables),
  };
}

function R4ShadowPreview() {
  const initial = QUICK_CASES[2].state;
  const [adults, setAdults] = useState(initial.adults);
  const [olderChildren, setOlderChildren] = useState(initial.olderChildren);
  const [children, setChildren] = useState(initial.children);
  const [serviceHours, setServiceHours] = useState(initial.serviceHours);
  const [selectedSolids, setSelectedSolids] = useState([...initial.selectedSolids]);
  const [selectedSolidProductIds, setSelectedSolidProductIds] = useState([...initial.selectedSolidProductIds]);
  const [externalSolids, setExternalSolids] = useState([...initial.externalSolids]);
  const [beveragesEnabled, setBeveragesEnabled] = useState(initial.beveragesEnabled);
  const [selectedBeverages, setSelectedBeverages] = useState([...initial.selectedBeverages]);
  const [includeWaiters, setIncludeWaiters] = useState(Boolean(initial.includeWaiters));
  const [includeDisposables, setIncludeDisposables] = useState(Boolean(initial.includeDisposables));
  const [lambdaMode, setLambdaMode] = useState("central");

  const lambdaIn =
    lambdaMode === "low"
      ? R4_PARAMETERS.substitution.lambdaInSensitivity[0]
      : lambdaMode === "high"
        ? R4_PARAMETERS.substitution.lambdaInSensitivity[1]
        : R4_PARAMETERS.substitution.lambdaInCentral;

  const selectedProductIds = [
    ...selectedSolidProductIds,
    ...(beveragesEnabled ? selectedBeverages : []),
  ];
  const selectedCategories = beveragesEnabled
    ? [...selectedSolids, "Bebidas"]
    : [...selectedSolids];
  const selectedIdSet = new Set(selectedSolidProductIds);
  const selectedFlavorCount = (category) =>
    PRODUCT_CATALOG.filter(
      (product) => product.commercialCategory === category && selectedIdSet.has(product.id)
    ).length;

  const result = generateR4ShadowRecommendation({
    adults,
    olderChildren,
    children,
    serviceHours,
    selectedCategories,
    selectedProductIds,
    externalCategories: externalSolids,
    productCatalog: PRODUCT_CATALOG,
    flavorCounts: {
      Tortas: Math.max(1, selectedFlavorCount("Tortas")),
      Bolos: Math.max(1, selectedFlavorCount("Bolos")),
    },
    lambdaIn,
    includeBeverages: beveragesEnabled,
  });
  const skuAllocation = allocateR4ShadowSkus({
    recommendation: result,
    selectedProductIds: selectedSolidProductIds,
    productCatalog: PRODUCT_CATALOG,
  });
  const commercialPreview = buildR4ShadowCommercialPreview({
    recommendation: result,
    skuAllocation,
    selectedBeverageProductIds: beveragesEnabled ? selectedBeverages : [],
    productCatalog: PRODUCT_CATALOG,
    serviceHours,
    includeWaiters,
    includeDisposables,
  });

  function toggleSolid(category) {
    const removing = selectedSolids.includes(category);
    setSelectedSolids((current) =>
      removing ? current.filter((item) => item !== category) : [...current, category]
    );
    setExternalSolids((current) => current.filter((item) => item !== category));
    setSelectedSolidProductIds((current) => {
      if (removing) {
        const idsInCategory = new Set((SOLID_PRODUCTS_BY_CATEGORY[category] || []).map((product) => product.id));
        return current.filter((id) => !idsInCategory.has(id));
      }
      const alreadySelected = (SOLID_PRODUCTS_BY_CATEGORY[category] || []).some((product) => current.includes(product.id));
      const first = SOLID_PRODUCTS_BY_CATEGORY[category]?.[0];
      return !alreadySelected && first ? [...current, first.id] : current;
    });
  }

  function toggleSolidSku(id) {
    setSelectedSolidProductIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleExternal(category) {
    if (selectedSolids.includes(category)) return;
    setExternalSolids((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  function toggleBeverage(id) {
    setSelectedBeverages((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function applyQuickCase(item) {
    const next = stateFromQuickCase(item.state);
    setAdults(next.adults);
    setOlderChildren(next.olderChildren);
    setChildren(next.children);
    setServiceHours(next.serviceHours);
    setSelectedSolids(next.selectedSolids);
    setSelectedSolidProductIds(next.selectedSolidProductIds);
    setExternalSolids(next.externalSolids);
    setBeveragesEnabled(next.beveragesEnabled);
    setSelectedBeverages(next.selectedBeverages);
    setIncludeWaiters(next.includeWaiters);
    setIncludeDisposables(next.includeDisposables);
    setLambdaMode("central");
  }

  const contractedCategories = result.solids.categories.filter((category) => category.contracted);
  const externalCategories = result.solids.categories.filter((category) => !category.contracted && category.external);

  return (
    <main className="r4-preview-shell">
      <header className="r4-preview-header">
        <div className="r4-preview-brand">
          <img src={rodaFestaLogoCreme} alt="Roda Festa" />
          <div>
            <span className="r4-preview-eyebrow">Laboratório de recomendação</span>
            <h1>RF-REC-2 · R4 Shadow</h1>
          </div>
        </div>
        <div className="r4-preview-actions">
          <span className="r4-preview-status">NÃO PRODUÇÃO</span>
          <Link to="/planning-book">Abrir PlanningBook atual</Link>
        </div>
      </header>

      <section className="r4-preview-intro">
        <div>
          <p className="r4-preview-kicker">Motor novo, ambiente isolado</p>
          <h2>Teste o cérebro da R4 sem alterar nenhum orçamento real.</h2>
          <p>
            Esta tela chama diretamente o motor shadow publicado. N&atilde;o cria sess&atilde;o, n&atilde;o grava cliente,
            n&atilde;o gera proposta comercial, n&atilde;o finaliza proposta e n&atilde;o substitui o RF-REC-1. A aloca&ccedil;&atilde;o por SKU e o comercial abaixo s&atilde;o previews
            isolados: usam as quantidades da R4 e reaproveitam as regras RF-COM-1 sem gravar nenhum or&ccedil;amento.
          </p>
        </div>
        <dl>
          <div><dt>Versão</dt><dd>{result.versions.recommendation}</dd></div>
          <div><dt>Estado</dt><dd>{result.authoritative ? "Autoritativo" : "Shadow isolado"}</dd></div>
          <div><dt>Gate Petiscos</dt><dd>{result.parameters.petiscoGateResult}</dd></div>
        </dl>
      </section>

      <section className="r4-preview-quickcases" aria-label="Cenários rápidos">
        {QUICK_CASES.map((item) => (
          <button key={item.id} type="button" onClick={() => applyQuickCase(item)}>
            {item.label}
          </button>
        ))}
      </section>

      <div className="r4-preview-grid">
        <section className="r4-preview-panel r4-preview-controls">
          <div className="r4-preview-panel-title">
            <span>01</span>
            <div>
              <h3>Monte o cenário</h3>
              <p>Os resultados mudam ao vivo.</p>
            </div>
          </div>

          <div className="r4-preview-fields r4-preview-fields--4">
            <label>
              Adultos
              <input type="number" min="0" value={adults} onChange={(event) => setAdults(Number(event.target.value) || 0)} />
            </label>
            <label>
              Crianças 7+
              <input type="number" min="0" value={olderChildren} onChange={(event) => setOlderChildren(Number(event.target.value) || 0)} />
            </label>
            <label>
              Crianças 0–6
              <input type="number" min="0" value={children} onChange={(event) => setChildren(Number(event.target.value) || 0)} />
            </label>
            <label>
              Duração
              <select value={serviceHours} onChange={(event) => setServiceHours(Number(event.target.value))}>
                {[4, 5, 6, 7, 8].map((hours) => <option key={hours} value={hours}>{hours} horas</option>)}
              </select>
            </label>
          </div>

          <fieldset className="r4-preview-fieldset">
            <legend>O que a Roda Festa vai fornecer?</legend>
            <p className="r4-preview-help">Agora escolha tamb&eacute;m os sabores/SKUs. Torta e Bolo usam a quantidade de sabores escolhidos para a regra de variedade.</p>
            <div className="r4-preview-option-grid">
              {SOLID_OPTIONS.map((option) => {
                const categorySelected = selectedSolids.includes(option.id);
                const products = SOLID_PRODUCTS_BY_CATEGORY[option.id] || [];
                return (
                  <div key={option.id} className={`r4-preview-option-group ${categorySelected ? "is-selected" : ""}`}>
                    <label className="r4-preview-option r4-preview-option--category">
                      <input
                        type="checkbox"
                        checked={categorySelected}
                        onChange={() => toggleSolid(option.id)}
                      />
                      <span>
                        <strong>{option.title}</strong>
                        <small>{option.note}</small>
                      </span>
                    </label>
                    {categorySelected && (
                      <div className="r4-preview-sku-picker">
                        <div className="r4-preview-sku-picker-title">
                          <span>SKUs selecionados</span>
                          <small>aloca&ccedil;&atilde;o provis&oacute;ria igualit&aacute;ria</small>
                        </div>
                        <div className="r4-preview-sku-grid">
                          {products.map((product) => (
                            <label key={product.id} className={selectedSolidProductIds.includes(product.id) ? "is-checked" : ""}>
                              <input
                                type="checkbox"
                                checked={selectedSolidProductIds.includes(product.id)}
                                onChange={() => toggleSolidSku(product.id)}
                              />
                              <span>{product.name}</span>
                              <small>lote {product.lotSize || 1}</small>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="r4-preview-fieldset">
            <legend>Há comida externa presente?</legend>
            <p className="r4-preview-help">Use quando outro fornecedor/família levar Mini ou Torta. Entra no apetite, mas não vira fornecimento da Roda Festa.</p>
            <div className="r4-preview-inline-options">
              {["Mini lanches", "Tortas"].map((category) => (
                <label key={category} className={selectedSolids.includes(category) ? "is-disabled" : ""}>
                  <input
                    type="checkbox"
                    disabled={selectedSolids.includes(category)}
                    checked={externalSolids.includes(category)}
                    onChange={() => toggleExternal(category)}
                  />
                  {category}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="r4-preview-fieldset">
            <legend>Bebidas</legend>
            <label className="r4-preview-switch">
              <input
                type="checkbox"
                checked={beveragesEnabled}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  setBeveragesEnabled(enabled);
                  if (enabled && selectedBeverages.length === 0) {
                    setSelectedBeverages(BEVERAGE_OPTIONS.map((item) => item.id));
                  }
                }}
              />
              <span>Incluir cálculo de bebidas</span>
            </label>
            {beveragesEnabled && (
              <div className="r4-preview-inline-options">
                {BEVERAGE_OPTIONS.map((item) => (
                  <label key={item.id}>
                    <input
                      type="checkbox"
                      checked={selectedBeverages.includes(item.id)}
                      onChange={() => toggleBeverage(item.id)}
                    />
                    {item.label} · {item.share}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="r4-preview-fieldset">
            <legend>Servi&ccedil;os comerciais do preview</legend>
            <p className="r4-preview-help">Use para comparar o valor da R4 com uma proposta que inclua os mesmos servi&ccedil;os opcionais.</p>
            <div className="r4-preview-inline-options">
              <label>
                <input type="checkbox" checked={includeWaiters} onChange={(event) => setIncludeWaiters(event.target.checked)} />
                Incluir gar&ccedil;ons
              </label>
              <label>
                <input type="checkbox" checked={includeDisposables} onChange={(event) => setIncludeDisposables(event.target.checked)} />
                Incluir descart&aacute;veis
              </label>
            </div>
          </fieldset>

          <fieldset className="r4-preview-fieldset">
            <legend>Sensibilidade de λ_in</legend>
            <div className="r4-preview-segmented">
              <button type="button" className={lambdaMode === "low" ? "is-active" : ""} onClick={() => setLambdaMode("low")}>0,35</button>
              <button type="button" className={lambdaMode === "central" ? "is-active" : ""} onClick={() => setLambdaMode("central")}>Central</button>
              <button type="button" className={lambdaMode === "high" ? "is-active" : ""} onClick={() => setLambdaMode("high")}>0,43</button>
            </div>
          </fieldset>
        </section>

        <section className="r4-preview-panel r4-preview-results">
          <div className="r4-preview-panel-title">
            <span>02</span>
            <div>
              <h3>Resposta da R4</h3>
              <p>Categoria primeiro; SKU em preview provis&oacute;rio.</p>
            </div>
          </div>

          <div className="r4-preview-metrics">
            <article><span>Convidados reais</span><strong>{formatNumber(result.guests.realGuests, 1)}</strong></article>
            <article><span>Equivalentes R4</span><strong>{formatNumber(result.guests.planningGuests, 2)}</strong></article>
            <article><span>Fator duração</span><strong>{formatNumber(result.service?.factor ?? result.solids.duration.factor, 2)}×</strong></article>
            <article><span>b adulto ref.</span><strong>{formatNumber(result.parameters.bAdultReference, 0)} g</strong></article>
            <article><span>λ_in usado</span><strong>{formatNumber(result.parameters.lambdaIn, 6)}</strong></article>
            <article><span>Massa esperada</span><strong>{formatNumber(result.solids.expectedMassPerAdultRealized, 0)} g/adulto</strong></article>
          </div>

          {result.warnings.length > 0 && (
            <div className="r4-preview-warning">
              <strong>Notas do motor</strong>
              {result.warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          )}

          <div className="r4-preview-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Esperado / adulto</th>
                  <th>Planejamento R4</th>
                  <th>Substituição</th>
                </tr>
              </thead>
              <tbody>
                {contractedCategories.map((category) => (
                  <tr key={category.category}>
                    <td>
                      <strong>{category.category}</strong>
                      {category.category === "Petiscos" && <small>{category.petiscoConversion.regime} · {formatNumber(category.petiscoConversion.readyGrams, 1)} g/un. ref.</small>}
                    </td>
                    <td>{categoryExpectedLabel(category)}</td>
                    <td><strong>{categoryPlannedLabel(category)}</strong></td>
                    <td>{formatNumber(category.substitutionMultiplier, 3)}×</td>
                  </tr>
                ))}
                {contractedCategories.length === 0 && (
                  <tr><td colSpan="4" className="r4-preview-empty">Selecione pelo menos uma categoria sólida para ver o planejamento.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <section className="r4-preview-sku-allocation">
            <div className="r4-preview-section-heading">
              <div>
                <h4>Aloca&ccedil;&atilde;o por SKU</h4>
                <p>Preview neutro: menor excedente comercial poss&iacute;vel e divis&atilde;o o mais equilibrada poss&iacute;vel entre os SKUs escolhidos.</p>
              </div>
              <span>{skuAllocation.policy.id}</span>
            </div>

            {skuAllocation.warnings.length > 0 && (
              <div className="r4-preview-warning r4-preview-warning--compact">
                <strong>Sele&ccedil;&atilde;o incompleta</strong>
                {skuAllocation.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            )}

            <div className="r4-preview-allocation-groups">
              {skuAllocation.categories.map((category) => (
                <article key={category.category} className="r4-preview-allocation-card">
                  <div className="r4-preview-allocation-card-head">
                    <div>
                      <strong>{category.category}</strong>
                      <small>Meta da categoria: {formatAllocationTarget(category)}</small>
                    </div>
                    <span className={category.status === "allocated-preview" ? "is-ok" : "is-pending"}>
                      {formatAllocationOverage(category)}
                    </span>
                  </div>
                  {category.items.length > 0 ? (
                    <div className="r4-preview-allocation-lines">
                      {category.items.map((item) => (
                        <div key={item.id}>
                          <span>
                            <strong>{item.name}</strong>
                            <small>lote {item.lotSize}</small>
                          </span>
                          <b>{formatAllocationItem(item)}</b>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="r4-preview-allocation-empty">Escolha ao menos um SKU desta categoria.</p>
                  )}
                </article>
              ))}
            </div>
          </section>

          {externalCategories.length > 0 && (
            <div className="r4-preview-external">
              <strong>Contexto externo reconhecido</strong>
              <p>{externalCategories.map((item) => item.category).join(" + ")} participa da substituição, mas recebe quantidade planejada zero pela Roda Festa.</p>
            </div>
          )}

          <div className="r4-preview-conservation">
            <div>
              <span>Cobertura B1</span>
              <strong>{formatNumber(result.solids.substitution.coverage.B1 * 100, 1)}%</strong>
            </div>
            <div>
              <span>Cobertura B2</span>
              <strong>{formatNumber(result.solids.substitution.coverage.B2 * 100, 1)}%</strong>
            </div>
            <div>
              <span>Teto de variedade</span>
              <strong>{result.solids.variety.capApplied ? "Aplicado" : "Livre"}</strong>
            </div>
            <div>
              <span>Máx. variedade</span>
              <strong>{formatNumber(result.solids.variety.maxMassPerAdult, 0)} g/adulto</strong>
            </div>
          </div>

          {beveragesEnabled && (
            <section className="r4-preview-beverages">
              <div className="r4-preview-section-heading">
                <h4>Bebidas</h4>
                <span>mix fixo · sem renormalização</span>
              </div>
              <div className="r4-preview-metrics r4-preview-metrics--beverages">
                <article><span>Referência total</span><strong>{formatLiters(result.beverages.referenceTotalExpectedConsumptionMl)}</strong></article>
                <article><span>Coberto</span><strong>{formatLiters(result.beverages.expectedConsumptionMl)}</strong></article>
                <article><span>Externo / descoberto</span><strong>{formatLiters(result.beverages.externalOrUncoveredExpectedMl)}</strong></article>
                <article><span>Estoque a levar</span><strong>{formatLiters(result.beverages.stockToTakeMl)}</strong></article>
              </div>
              <div className="r4-preview-beverage-lines">
                {selectedBeverages.map((id) => {
                  const option = BEVERAGE_OPTIONS.find((item) => item.id === id);
                  const stock = result.beverages.stockToTakeBySku[id];
                  if (!option || !stock) return null;
                  return (
                    <div key={id}>
                      <span>{option.label}</span>
                      <strong>
                        {stock.roundedUnitsToCurrentLot
                          ? `${formatNumber(stock.roundedUnitsToCurrentLot, 0)} un. para estoque`
                          : `${formatLiters(stock.ml)} para estoque`}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="r4-preview-commercial">
            <div className="r4-preview-section-heading">
              <div>
                <h4>Comercial R4 · preview</h4>
                <p>Quantidades da R4 + aloca&ccedil;&atilde;o SKU preview + regras comerciais {commercialPreview.versions.commercialRules}.</p>
              </div>
              <span>{commercialPreview.policy.id}</span>
            </div>

            <div className="r4-preview-commercial-totals">
              <article>
                <span>Contratado</span>
                <strong>{formatCurrency(commercialPreview.totals.contractedTotal)}</strong>
                <small>{formatCurrency(commercialPreview.totals.contractedPerRealGuest)} / convidado real</small>
              </article>
              <article>
                <span>Consigna&ccedil;&atilde;o conhecida</span>
                <strong>{formatCurrency(commercialPreview.totals.knownConsignmentEstimate)}</strong>
                <small>{commercialPreview.totals.generalEstimateComplete ? "estimativa completa" : "estimativa parcial"}</small>
              </article>
              <article className={commercialPreview.totals.generalEstimateComplete ? "" : "is-partial"}>
                <span>Estimativa geral conhecida</span>
                <strong>{formatCurrency(commercialPreview.totals.knownGeneralEstimate)}</strong>
                <small>{formatCurrency(commercialPreview.totals.knownGeneralPerRealGuest)} / convidado real</small>
              </article>
            </div>

            <div className="r4-preview-commercial-structure">
              <div><span>Carrinhos</span><strong>{commercialPreview.carts.totalCarts}</strong></div>
              <div><span>Preparadores</span><strong>{commercialPreview.preparers}</strong></div>
              <div><span>Gar&ccedil;ons</span><strong>{commercialPreview.waiters.quantity}</strong></div>
              <div><span>Descart&aacute;veis</span><strong>{commercialPreview.disposables.included ? formatCurrency(commercialPreview.disposables.value) : "N&atilde;o"}</strong></div>
            </div>

            <div className="r4-preview-commercial-lines">
              {commercialPreview.investment.ledger.contractedLines.map((line) => (
                <div key={line.id}>
                  <span>{line.label}<small>{line.type === "product" ? `${formatNumber(line.quantity, 0)} × ${formatCurrency(line.unitPrice)}` : `${formatNumber(line.quantity, 0)} × ${formatCurrency(line.unitPrice)}`}</small></span>
                  <strong>{formatCurrency(line.subtotal)}</strong>
                </div>
              ))}
              {commercialPreview.investment.ledger.consignmentLines.map((line) => (
                <div key={line.id} className="is-consignment">
                  <span>{line.label}<small>{formatNumber(line.quantity, 0)} × {formatCurrency(line.unitPrice)} · consigna&ccedil;&atilde;o</small></span>
                  <strong>{formatCurrency(line.subtotal)}</strong>
                </div>
              ))}
            </div>

            {commercialPreview.unresolved.length > 0 && (
              <div className="r4-preview-warning r4-preview-warning--compact">
                <strong>Estimativa propositalmente incompleta</strong>
                {commercialPreview.unresolved.map((item, index) => (
                  <p key={`${item.productId || item.category || "pending"}-${index}`}>
                    {item.name || item.category || item.productId}: {item.reason === "missing_volume_per_unit_in_r4_beverage_model"
                      ? `a R4 sabe que deve levar ${formatLiters(item.stockToTakeMl)}, mas o cadastro ainda n&atilde;o informa o volume comercial por unidade. O preview n&atilde;o inventou esse dado.`
                      : "dados insuficientes para precificar com seguran&ccedil;a."}
                  </p>
                ))}
              </div>
            )}
          </section>

          <div className="r4-preview-boundary">
            <strong>Limite desta etapa</strong>
            <p>
              A aloca&ccedil;&atilde;o por SKU &eacute; provis&oacute;ria e igualit&aacute;ria; ainda n&atilde;o usa prefer&ecirc;ncia de sabor ou consumo observado por SKU.
              O comercial agora &eacute; calculado somente em preview, reaproveitando RF-COM-1. Ainda n&atilde;o grava sess&atilde;o, n&atilde;o finaliza proposta e n&atilde;o substitui o RF-REC-1 em Produ&ccedil;&atilde;o.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default R4ShadowPreview;
