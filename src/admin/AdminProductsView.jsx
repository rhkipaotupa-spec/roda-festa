import { useEffect, useMemo, useState } from "react";
import "./AdminCommercial.css";
import "./AdminProductsCatalog.css";

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
  Petiscos: { operationalGroup: "fried", lotSize: 25, priceUnit: "unit", portionGrams: "", productionPerHour: 120 },
  "Mini lanches": { operationalGroup: "hotSandwiches", lotSize: 5, priceUnit: "unit", portionGrams: "", productionPerHour: 80 },
  Tortas: { operationalGroup: "hotSandwiches", lotSize: 1, priceUnit: "portion150g", portionGrams: 150, productionPerHour: 40 },
  Doces: { operationalGroup: "sweets", lotSize: 10, priceUnit: "unit", portionGrams: "", productionPerHour: 200 },
  Bolos: { operationalGroup: "cake", lotSize: 1, priceUnit: "portion120g", portionGrams: 120, productionPerHour: 100 },
  "Brigadeiro no tacho": { operationalGroup: "tacho", lotSize: 1, priceUnit: "portion80g", portionGrams: 80, productionPerHour: "" },
  Bebidas: { operationalGroup: "beverages", lotSize: 10, priceUnit: "unit", portionGrams: "", productionPerHour: 150 },
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
    productionPerHour: defaults.productionPerHour,
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
    productionPerHour: product?.productionPerHour ?? "",
    portionGrams: product?.portionGrams ?? "",
  };
}

function commonValue(items, field) {
  if (!Array.isArray(items) || items.length === 0) return "";
  const first = items[0]?.[field] ?? "";
  const allEqual = items.every((item) => (item?.[field] ?? "") === first);
  return allEqual ? first : "";
}

function bulkDraftFromProducts(items) {
  return {
    changeUnitPrice: false,
    unitPrice: commonValue(items, "unitPrice"),
    changeLotSize: false,
    lotSize: commonValue(items, "lotSize"),
    changeProductionPerHour: false,
    productionPerHour: commonValue(items, "productionPerHour"),
  };
}

async function fetchProducts() {
  const response = await fetch(ENDPOINT, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true || !Array.isArray(payload.products)) {
    throw new Error("load_failed");
  }
  return payload.products;
}

export default function AdminProductsView({ embedded = false } = {}) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(() => emptyDraft());
  const [editingExisting, setEditingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkDraft, setBulkDraft] = useState(() => bulkDraftFromProducts([]));
  const [bulkSaving, setBulkSaving] = useState(false);

  async function loadProducts() {
    setStatus("loading");
    try {
      const nextProducts = await fetchProducts();
      setProducts(nextProducts);
      setStatus("ready");
    } catch {
      setStatus("error");
      setMessage("Não foi possível carregar o catálogo agora.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadInitialProducts() {
      try {
        const nextProducts = await fetchProducts();
        if (cancelled) return;
        setProducts(nextProducts);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage("Não foi possível carregar o catálogo agora.");
      }
    }
    loadInitialProducts();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return products;
    return products.filter((product) => [product.name, product.id, product.commercialCategory]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("pt-BR")
      .includes(term));
  }, [products, search]);

  const groupedProducts = useMemo(() => CATEGORIES
    .map((category) => ({
      category,
      products: filtered.filter((product) => product.commercialCategory === category),
      total: products.filter((product) => product.commercialCategory === category).length,
    }))
    .filter((group) => group.products.length > 0), [filtered, products]);

  function closeEditors() {
    setEditorOpen(false);
    setCategoryEditorOpen(false);
  }

  function newProduct() {
    setDraft(emptyDraft());
    setEditingExisting(false);
    setMessage("");
    setCategoryEditorOpen(false);
    setEditorOpen(true);
  }

  function editProduct(product) {
    setDraft(draftFromProduct(product));
    setEditingExisting(true);
    setMessage("");
    setCategoryEditorOpen(false);
    setEditorOpen(true);
  }

  function editCategory(category) {
    const categoryProducts = products.filter((product) => product.commercialCategory === category);
    setBulkCategory(category);
    setBulkDraft(bulkDraftFromProducts(categoryProducts));
    setMessage("");
    setEditorOpen(false);
    setCategoryEditorOpen(true);
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
      productionPerHour: defaults.productionPerHour,
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
      productionPerHour: draft.productionPerHour === "" ? null : Number(draft.productionPerHour),
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
      setEditorOpen(false);
      await loadProducts();
    } catch {
      setMessage("Não foi possível salvar. Confira preço, lote, capacidade e categoria.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory(event) {
    event.preventDefault();
    if (bulkSaving) return;

    const updates = {};
    if (bulkDraft.changeUnitPrice) updates.unitPrice = Number(bulkDraft.unitPrice);
    if (bulkDraft.changeLotSize) updates.lotSize = Number(bulkDraft.lotSize);
    if (bulkDraft.changeProductionPerHour) {
      updates.productionPerHour = Number(bulkDraft.productionPerHour);
    }

    const changedFields = Object.keys(updates);
    if (changedFields.length === 0) {
      setMessage("Selecione pelo menos um campo para atualizar na categoria.");
      return;
    }

    const affectedCount = products.filter(
      (product) => product.commercialCategory === bulkCategory,
    ).length;
    if (affectedCount === 0) {
      setMessage("Esta categoria não possui produtos para atualizar.");
      return;
    }

    const confirmed = window.confirm(
      `Aplicar as alterações em ${affectedCount} produto${affectedCount === 1 ? "" : "s"} de ${bulkCategory}? Cada produto receberá uma nova revisão histórica.`,
    );
    if (!confirmed) return;

    setBulkSaving(true);
    setMessage("");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_UPDATE",
          commercialCategory: bulkCategory,
          updates,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) throw new Error(payload?.error || "bulk_save_failed");
      setMessage(
        `${payload.updatedCount} produto${payload.updatedCount === 1 ? "" : "s"} de ${bulkCategory} atualizado${payload.updatedCount === 1 ? "" : "s"}. O histórico individual foi preservado.`,
      );
      setCategoryEditorOpen(false);
      await loadProducts();
    } catch {
      setMessage("Não foi possível concluir a atualização em massa. O catálogo foi recarregado; confira a categoria antes de repetir.");
      await loadProducts();
    } finally {
      setBulkSaving(false);
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

  const bulkAffectedCount = products.filter(
    (product) => product.commercialCategory === bulkCategory,
  ).length;

  return (
    <section className={embedded ? "rf-commercial-page rf-commercial-page--embedded" : "rf-commercial-page"}>
      <header className="rf-commercial-header">
        <div>
          <span>Roda Festa · Admin</span>
          <h1>Produtos e capacidades</h1>
          <p>Preço, lote e capacidade podem mudar sem apagar o histórico dos orçamentos antigos.</p>
        </div>
        <div className="rf-commercial-header__actions">
          {!embedded ? <a href="/admin">Voltar ao Admin</a> : null}
          {!embedded ? <a href="/admin/editar-pedido">Pedidos</a> : null}
          <button className="rf-commercial-create-product" type="button" onClick={newProduct}>+ Cadastrar produto</button>
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
          {status === "ready" && groupedProducts.length === 0 ? (
            <div className="rf-product-categories__empty">Nenhum produto encontrado para esta busca.</div>
          ) : null}
          {status === "ready" && groupedProducts.length > 0 ? (
            <div className="rf-product-categories">
              {groupedProducts.map((group) => (
                <section className="rf-product-category" key={group.category}>
                  <header className="rf-product-category__header">
                    <div>
                      <span>Categoria</span>
                      <h2>{group.category}</h2>
                      <small>
                        {search.trim() && group.products.length !== group.total
                          ? `${group.products.length} de ${group.total} produtos nesta busca`
                          : `${group.total} produto${group.total === 1 ? "" : "s"}`}
                      </small>
                    </div>
                    <button type="button" className="rf-product-category__edit" onClick={() => editCategory(group.category)}>
                      Editar categoria
                    </button>
                  </header>

                  <div className="rf-product-category__items">
                    {group.products.map((product) => (
                      <article key={product.id} className={`rf-product-row ${product.active ? "" : "is-inactive"}`}>
                        <div>
                          <span>{product.active ? "Ativo" : "Inativo"}</span>
                          <strong>{product.name}</strong>
                          <small>{product.id}</small>
                        </div>
                        <div className="rf-product-row__numbers">
                          <span>{currency(product.unitPrice)}</span>
                          <small>Lote {product.lotSize} · capacidade {product.productionPerHour == null ? "não medida" : `${product.productionPerHour}/h`}</small>
                        </div>
                        <div className="rf-product-row__actions">
                          <button type="button" onClick={() => editProduct(product)}>Editar</button>
                          <button type="button" className={product.active ? "is-danger" : ""} onClick={() => toggleActive(product)}>
                            {product.active ? "Desativar" : "Reativar"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </section>

        {embedded && (editorOpen || categoryEditorOpen) ? (
          <button
            type="button"
            className="rf-commercial-drawer-backdrop"
            aria-label="Fechar editor de catálogo"
            onClick={closeEditors}
          />
        ) : null}

        <section className={`rf-commercial-editor ${embedded && editorOpen ? "is-open" : ""}`}>
          <div className="rf-commercial-editor__heading">
            {embedded ? <button type="button" className="rf-commercial-drawer-close" onClick={() => setEditorOpen(false)} aria-label="Fechar editor">×</button> : null}
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
              <label>Capacidade / hora<input type="number" min="0.01" step="0.01" required={draft.commercialCategory !== "Brigadeiro no tacho"} placeholder={draft.commercialCategory === "Brigadeiro no tacho" ? "Ainda não medida" : "Ex.: 120"} value={draft.productionPerHour} onChange={(event) => setDraft((current) => ({ ...current, productionPerHour: event.target.value }))} /></label>
              <label>Unidade<select value={draft.priceUnit} disabled={draft.commercialCategory === "Brigadeiro no tacho"} onChange={(event) => setDraft((current) => ({ ...current, priceUnit: event.target.value }))}><option value="unit">Unidade</option><option value="portion80g">Porção 80 g</option><option value="portion120g">Porção 120 g</option><option value="portion150g">Porção 150 g</option><option value="kg">Kg</option></select></label>
            </div>

            {draft.portionGrams !== "" && draft.portionGrams != null ? <label>Gramas por porção<input type="number" min="1" disabled={draft.commercialCategory === "Brigadeiro no tacho"} value={draft.portionGrams} onChange={(event) => setDraft((current) => ({ ...current, portionGrams: event.target.value }))} /></label> : null}

            <button className="rf-commercial-save" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar produto"}</button>
          </form>
        </section>

        {categoryEditorOpen ? (
          <section className={`rf-commercial-editor rf-commercial-category-editor ${embedded ? "is-open" : ""}`}>
            <div className="rf-commercial-editor__heading">
              {embedded ? <button type="button" className="rf-commercial-drawer-close" onClick={() => setCategoryEditorOpen(false)} aria-label="Fechar edição da categoria">×</button> : null}
              <span>Editar categoria</span>
              <h2>{bulkCategory}</h2>
              <small>Altere somente os campos que devem ficar iguais para toda a categoria.</small>
            </div>

            <form onSubmit={saveCategory} className="rf-commercial-bulk-form">
              <div className="rf-commercial-bulk-summary">
                <strong>{bulkAffectedCount} produto{bulkAffectedCount === 1 ? "" : "s"}</strong>
                <span>Inclui itens ativos e inativos da categoria. Cada um manterá revisão e histórico próprios.</span>
              </div>

              <label className="rf-commercial-bulk-field">
                <span className="rf-commercial-bulk-field__toggle">
                  <input type="checkbox" checked={bulkDraft.changeUnitPrice} onChange={(event) => setBulkDraft((current) => ({ ...current, changeUnitPrice: event.target.checked }))} />
                  <strong>Definir o mesmo preço</strong>
                </span>
                <input type="number" min="0" step="0.01" required={bulkDraft.changeUnitPrice} disabled={!bulkDraft.changeUnitPrice} value={bulkDraft.unitPrice} onChange={(event) => setBulkDraft((current) => ({ ...current, unitPrice: event.target.value }))} placeholder="Ex.: 1,75" />
              </label>

              <label className="rf-commercial-bulk-field">
                <span className="rf-commercial-bulk-field__toggle">
                  <input type="checkbox" checked={bulkDraft.changeLotSize} onChange={(event) => setBulkDraft((current) => ({ ...current, changeLotSize: event.target.checked }))} />
                  <strong>Definir o mesmo lote mínimo</strong>
                </span>
                <input type="number" min="0.01" step="0.01" required={bulkDraft.changeLotSize} disabled={!bulkDraft.changeLotSize} value={bulkDraft.lotSize} onChange={(event) => setBulkDraft((current) => ({ ...current, lotSize: event.target.value }))} placeholder="Ex.: 25" />
              </label>

              <label className="rf-commercial-bulk-field">
                <span className="rf-commercial-bulk-field__toggle">
                  <input type="checkbox" checked={bulkDraft.changeProductionPerHour} onChange={(event) => setBulkDraft((current) => ({ ...current, changeProductionPerHour: event.target.checked }))} />
                  <strong>Definir a mesma capacidade / hora</strong>
                </span>
                <input type="number" min="0.01" step="0.01" required={bulkDraft.changeProductionPerHour} disabled={!bulkDraft.changeProductionPerHour} value={bulkDraft.productionPerHour} onChange={(event) => setBulkDraft((current) => ({ ...current, productionPerHour: event.target.value }))} placeholder="Use apenas capacidade realmente medida" />
                <small>Só marque este campo quando houver uma medição operacional confiável.</small>
              </label>

              <div className="rf-commercial-bulk-warning">
                Nome, código, unidade, composição e categoria dos produtos não são alterados por esta ação.
              </div>

              <button className="rf-commercial-save" type="submit" disabled={bulkSaving}>
                {bulkSaving ? "Aplicando..." : `Aplicar em ${bulkAffectedCount} produto${bulkAffectedCount === 1 ? "" : "s"}`}
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </section>
  );
}
