import { useEffect, useMemo, useState } from "react";
import "./AdminCommercial.css";

const ENDPOINT = "/api/admin-products";

const CATEGORIES = [
  "Petiscos",
  "Mini lanches",
  "Tortas",
  "Doces",
  "Bolos",
  "Brigadeiro no tacho",
  "Bebidas",
];

const CATEGORY_DEFAULTS = {
  Petiscos: { operationalGroup: "fried", lotSize: 25, priceUnit: "unit", portionGrams: "" },
  "Mini lanches": { operationalGroup: "hotSandwiches", lotSize: 5, priceUnit: "unit", portionGrams: "" },
  Tortas: { operationalGroup: "hotSandwiches", lotSize: 1, priceUnit: "portion150g", portionGrams: 150 },
  Doces: { operationalGroup: "sweets", lotSize: 10, priceUnit: "unit", portionGrams: "" },
  Bolos: { operationalGroup: "cake", lotSize: 1, priceUnit: "portion120g", portionGrams: 120 },
  "Brigadeiro no tacho": { operationalGroup: "tacho", lotSize: 1, priceUnit: "portion80g", portionGrams: 80 },
  Bebidas: { operationalGroup: "beverages", lotSize: 10, priceUnit: "unit", portionGrams: "" },
};

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function currency(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function emptyDraft() {
  const defaults = CATEGORY_DEFAULTS.Petiscos;
  return {
    id: "",
    name: "",
    description: "",
    commercialCategory: "Petiscos",
    operationalGroup: defaults.operationalGroup,
    productionPerHour: 120,
    suggestedUnitsPerEquivalentGuest: 1,
    lotSize: defaults.lotSize,
    unitPrice: 0,
    priceUnit: defaults.priceUnit,
    portionGrams: defaults.portionGrams,
    active: true,
    consignment: false,
    countsAsMainCart: true,
  };
}

function draftFromProduct(product) {
  return {
    ...emptyDraft(),
    ...product,
    portionGrams: product?.portionGrams ?? "",
  };
}

export default function AdminProductsView() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(() => emptyDraft());
  const [editingExisting, setEditingExisting] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    setStatus("loading");
    try {
      const response = await fetch(ENDPOINT, { credentials: "same-origin", headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true || !Array.isArray(payload.products)) {
        throw new Error("load_failed");
      }
      setProducts(payload.products);
      setStatus("ready");
    } catch {
      setStatus("error");
      setMessage("Não foi possível carregar o catálogo agora.");
    }
  }

  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return products;
    return products.filter((product) => [product.name, product.id, product.commercialCategory]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("pt-BR")
      .includes(term));
  }, [products, search]);

  function newProduct() {
    setDraft(emptyDraft());
    setEditingExisting(false);
    setMessage("");
  }

  function editProduct(product) {
    setDraft(draftFromProduct(product));
    setEditingExisting(true);
    setMessage("");
  }

  function changeCategory(category) {
    const defaults = CATEGORY_DEFAULTS[category] || CATEGORY_DEFAULTS.Petiscos;
    setDraft((current) => ({
      ...current,
      commercialCategory: category,
      operationalGroup: defaults.operationalGroup,
      lotSize: defaults.lotSize,
      priceUnit: defaults.priceUnit,
      portionGrams: defaults.portionGrams,
      consignment: category === "Bebidas",
      countsAsMainCart: !["Doces", "Bolos"].includes(category),
    }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");

    const id = editingExisting ? draft.id : (draft.id || slugify(draft.name));
    const product = {
      ...draft,
      id,
      productionPerHour: Number(draft.productionPerHour),
      suggestedUnitsPerEquivalentGuest: Number(draft.suggestedUnitsPerEquivalentGuest || 0),
      lotSize: Number(draft.lotSize),
      unitPrice: Number(draft.unitPrice),
      portionGrams: draft.portionGrams === "" ? null : Number(draft.portionGrams),
    };

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPSERT", product }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error || "save_failed");
      setMessage(`Produto salvo. Revisão ${payload.revision}.`);
      setDraft(draftFromProduct(payload.product));
      setEditingExisting(true);
      await loadProducts();
    } catch {
      setMessage("Não foi possível salvar. Confira preço, lote, capacidade e categoria.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product) {
    setMessage("");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SET_ACTIVE", productId: product.id, active: !product.active }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) throw new Error("toggle_failed");
      setMessage(product.active
        ? "Produto desativado. Orçamentos históricos foram preservados."
        : "Produto reativado no catálogo.");
      await loadProducts();
    } catch {
      setMessage("Não foi possível alterar o estado do produto agora.");
    }
  }

  return (
    <main className="rf-commercial-page">
      <header className="rf-commercial-header">
        <div>
          <span>Roda Festa · Admin</span>
          <h1>Produtos e capacidades</h1>
          <p>Preço, lote e capacidade podem mudar sem apagar o histórico dos orçamentos antigos.</p>
        </div>
        <div className="rf-commercial-header__actions">
          <a href="/admin">Voltar ao Admin</a>
          <button type="button" onClick={newProduct}>+ Cadastrar produto</button>
        </div>
      </header>

      {message ? <div className="rf-commercial-notice" role="status">{message}</div> : null}

      <div className="rf-commercial-grid">
        <section className="rf-commercial-list">
          <label className="rf-commercial-search">
            <span>Buscar produto</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, categoria ou código" />
          </label>

          {status === "loading" ? <p>Carregando catálogo...</p> : null}
          {status === "error" ? <p>Catálogo indisponível.</p> : null}
          {status === "ready" ? filtered.map((product) => (
            <article key={product.id} className={`rf-product-row ${product.active ? "" : "is-inactive"}`}>
              <div>
                <span>{product.commercialCategory}</span>
                <strong>{product.name}</strong>
                <small>{product.id}</small>
              </div>
              <div className="rf-product-row__numbers">
                <span>{currency(product.unitPrice)}</span>
                <small>Lote {product.lotSize} · capacidade {product.productionPerHour}/h</small>
              </div>
              <div className="rf-product-row__actions">
                <button type="button" onClick={() => editProduct(product)}>Editar</button>
                <button type="button" className={product.active ? "is-danger" : ""} onClick={() => toggleActive(product)}>
                  {product.active ? "Desativar" : "Reativar"}
                </button>
              </div>
            </article>
          )) : null}
        </section>

        <section className="rf-commercial-editor">
          <div className="rf-commercial-editor__heading">
            <span>{editingExisting ? "Editar produto" : "Novo produto"}</span>
            <h2>{editingExisting ? draft.name : "Cadastrar no catálogo"}</h2>
            {editingExisting ? <small>O código é permanente para proteger orçamentos históricos.</small> : null}
          </div>

          <form onSubmit={saveProduct}>
            <label>Nome<input required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value, id: editingExisting ? current.id : slugify(event.target.value) }))} /></label>
            <label>Código<input required disabled={editingExisting} value={draft.id} onChange={(event) => setDraft((current) => ({ ...current, id: slugify(event.target.value) }))} /></label>
            <label>Categoria<select value={draft.commercialCategory} onChange={(event) => changeCategory(event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Descrição<input value={draft.description || ""} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>

            <div className="rf-commercial-form-grid">
              <label>Preço<input type="number" min="0" step="0.01" required value={draft.unitPrice} onChange={(event) => setDraft((current) => ({ ...current, unitPrice: event.target.value }))} /></label>
              <label>Lote mínimo<input type="number" min="0.01" step="0.01" required value={draft.lotSize} onChange={(event) => setDraft((current) => ({ ...current, lotSize: event.target.value }))} /></label>
              <label>Capacidade / hora<input type="number" min="0.01" step="0.01" required value={draft.productionPerHour} onChange={(event) => setDraft((current) => ({ ...current, productionPerHour: event.target.value }))} /></label>
              <label>Unidade<select value={draft.priceUnit} disabled={draft.commercialCategory === "Brigadeiro no tacho"} onChange={(event) => setDraft((current) => ({ ...current, priceUnit: event.target.value }))}><option value="unit">Unidade</option><option value="portion80g">Porção 80 g</option><option value="portion120g">Porção 120 g</option><option value="portion150g">Porção 150 g</option><option value="kg">Kg</option></select></label>
            </div>

            {draft.portionGrams !== "" && draft.portionGrams != null ? <label>Gramas por porção<input type="number" min="1" disabled={draft.commercialCategory === "Brigadeiro no tacho"} value={draft.portionGrams} onChange={(event) => setDraft((current) => ({ ...current, portionGrams: event.target.value }))} /></label> : null}

            <button className="rf-commercial-save" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar produto"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
