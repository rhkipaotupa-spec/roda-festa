import { useEffect, useMemo, useState } from "react";
import "./AdminCommercial.css";

const QUOTES_ENDPOINT = "/api/admin-quotes";
const PRODUCTS_ENDPOINT = "/api/admin-products";
const REVISION_ENDPOINT = "/api/admin-quote-revision";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function quantityStep(product) {
  return Math.max(Number(product?.lotSize) || 1, 0.01);
}

function snapshotItemMap(snapshot) {
  return new Map((snapshot?.items || []).map((item) => [String(item.id), item]));
}

export default function AdminQuoteEditView({ sessionId }) {
  const [quote, setQuote] = useState(null);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [includeWaiters, setIncludeWaiters] = useState(false);
  const [includeDisposables, setIncludeDisposables] = useState(false);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [newProductId, setNewProductId] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const [quoteResponse, productResponse] = await Promise.all([
          fetch(`${QUOTES_ENDPOINT}?id=${encodeURIComponent(sessionId)}`, { credentials: "same-origin", headers: { Accept: "application/json" } }),
          fetch(PRODUCTS_ENDPOINT, { credentials: "same-origin", headers: { Accept: "application/json" } }),
        ]);
        const [quotePayload, productPayload] = await Promise.all([
          quoteResponse.json().catch(() => null),
          productResponse.json().catch(() => null),
        ]);
        if (!quoteResponse.ok || quotePayload?.ok !== true || !quotePayload.quote) throw new Error("quote_load_failed");
        if (!productResponse.ok || productPayload?.ok !== true || !Array.isArray(productPayload.products)) throw new Error("product_load_failed");
        if (cancelled) return;

        const effective = quotePayload.quote.finalProposalSnapshot;
        if (!effective) {
          setQuote(quotePayload.quote);
          setProducts(productPayload.products);
          setStatus("requires-final");
          return;
        }

        setQuote(quotePayload.quote);
        setProducts(productPayload.products);
        setItems((effective.items || []).map((item) => ({ id: item.id, quantity: Number(item.quantity) || 0 })));
        setIncludeWaiters(Number(effective.waiters || 0) > 0);
        setIncludeDisposables(Boolean(effective.includeDisposables));
        setSavedSnapshot(effective);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage("Não foi possível abrir este pedido para edição.");
      }
    }
    load();
    return () => { cancelled = true; };
  }, [sessionId]);

  const productById = useMemo(() => new Map(products.map((product) => [String(product.id), product])), [products]);
  const currentSnapshotById = useMemo(() => snapshotItemMap(savedSnapshot), [savedSnapshot]);
  const activeProductsToAdd = useMemo(() => {
    const selected = new Set(items.map((item) => item.id));
    return products.filter((product) => product.active && !selected.has(product.id));
  }, [products, items]);

  const estimatedProductsTotal = useMemo(() => items.reduce((sum, item) => {
    const previous = currentSnapshotById.get(item.id);
    const product = productById.get(item.id);
    const unitPrice = Number(previous?.unitPrice ?? product?.unitPrice ?? 0);
    if (previous?.consignment ?? product?.consignment) return sum;
    return sum + Number(item.quantity || 0) * unitPrice;
  }, 0), [items, currentSnapshotById, productById]);

  function changeQuantity(id, value) {
    setItems((current) => current.map((item) => item.id === id
      ? { ...item, quantity: Math.max(0, Number(value) || 0) }
      : item));
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function addItem() {
    const product = productById.get(newProductId);
    if (!product) return;
    setItems((current) => [...current, { id: product.id, quantity: quantityStep(product) }]);
    setNewProductId("");
  }

  async function saveRevision() {
    if (saving || items.length === 0) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(REVISION_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          items,
          includeWaiters,
          includeDisposables,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true || !payload.effectiveSnapshot) {
        throw new Error(payload?.error || "revision_failed");
      }
      setSavedSnapshot(payload.effectiveSnapshot);
      setItems(payload.effectiveSnapshot.items.map((item) => ({ id: item.id, quantity: item.quantity })));
      setMessage(`Pedido atualizado com segurança. Revisão administrativa ${payload.revision}.`);
    } catch (error) {
      const reason = String(error?.message || "");
      setMessage(reason === "quote_changed_concurrently"
        ? "Este pedido mudou em outra tela. Reabra antes de editar novamente."
        : "Não foi possível salvar. Verifique lotes e quantidades dos produtos.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return <main className="rf-commercial-page"><p>Carregando pedido...</p></main>;
  if (status === "error") return <main className="rf-commercial-page"><a href="/admin">Voltar ao Admin</a><p>{message}</p></main>;
  if (status === "requires-final") return <main className="rf-commercial-page"><a href="/admin">Voltar ao Admin</a><h1>Este orçamento ainda não tem proposta final.</h1><p>A edição administrativa comercial fica disponível depois da primeira finalização.</p></main>;

  return (
    <main className="rf-commercial-page">
      <header className="rf-commercial-header">
        <div>
          <span>Roda Festa · Revisão administrativa</span>
          <h1>Editar pedido</h1>
          <p>{quote?.client?.name || "Cliente"} · o evento, convidados e data permanecem congelados; esta tela altera composição comercial e serviços.</p>
        </div>
        <div className="rf-commercial-header__actions"><a href="/admin">Voltar ao Admin</a></div>
      </header>

      {message ? <div className="rf-commercial-notice" role="status">{message}</div> : null}

      <div className="rf-commercial-grid">
        <section className="rf-commercial-list">
          <div className="rf-commercial-editor__heading">
            <span>Produtos</span>
            <h2>Composição atual</h2>
            <small>A proposta original nunca é apagada. Cada salvamento cria uma nova revisão administrativa.</small>
          </div>

          {items.map((item) => {
            const product = productById.get(item.id) || currentSnapshotById.get(item.id) || { id: item.id, name: item.id, lotSize: 1 };
            return (
              <article className="rf-product-row" key={item.id}>
                <div><span>{product.commercialCategory || "Produto"}</span><strong>{product.name || item.id}</strong><small>Lote {product.lotSize || 1}</small></div>
                <div className="rf-product-row__numbers">
                  <input type="number" min={quantityStep(product)} step={quantityStep(product)} value={item.quantity} onChange={(event) => changeQuantity(item.id, event.target.value)} />
                  <small>{money(currentSnapshotById.get(item.id)?.unitPrice ?? product.unitPrice)} por {product.priceUnit === "portion80g" ? "80 g" : "unidade/porção"}</small>
                </div>
                <div className="rf-product-row__actions"><button type="button" className="is-danger" onClick={() => removeItem(item.id)}>Remover</button></div>
              </article>
            );
          })}

          <div className="rf-commercial-add-product">
            <select value={newProductId} onChange={(event) => setNewProductId(event.target.value)}>
              <option value="">Adicionar produto...</option>
              {activeProductsToAdd.map((product) => <option key={product.id} value={product.id}>{product.commercialCategory} · {product.name}</option>)}
            </select>
            <button type="button" onClick={addItem} disabled={!newProductId}>Adicionar</button>
          </div>
        </section>

        <section className="rf-commercial-editor">
          <div className="rf-commercial-editor__heading"><span>Serviços e conferência</span><h2>Revisão do pedido</h2></div>
          <label className="rf-commercial-check"><input type="checkbox" checked={includeWaiters} onChange={(event) => setIncludeWaiters(event.target.checked)} /> Incluir garçons</label>
          <label className="rf-commercial-check"><input type="checkbox" checked={includeDisposables} onChange={(event) => setIncludeDisposables(event.target.checked)} /> Incluir descartáveis</label>

          <div className="rf-commercial-summary">
            <span>Produtos contratados antes dos serviços</span>
            <strong>{money(estimatedProductsTotal)}</strong>
            {savedSnapshot ? <><small>Último total contratado: {money(savedSnapshot.investmentTotal)}</small><small>Consignação estimada: {money(savedSnapshot.consignmentTotal)}</small><small>Carrinhos: {savedSnapshot.totalCarts}</small></> : null}
          </div>

          <button type="button" className="rf-commercial-save" disabled={saving || items.length === 0} onClick={saveRevision}>{saving ? "Salvando revisão..." : "Salvar revisão do pedido"}</button>
          <p className="rf-commercial-footnote">Preços já contratados são preservados para itens existentes. Produtos adicionados nesta revisão usam o preço atual do catálogo.</p>
        </section>
      </div>
    </main>
  );
}
