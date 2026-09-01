import { useEffect, useState } from "react";
import { PRODUCTS } from "./engine/planningRules.js";

function replaceRuntimeProducts(products) {
  for (const key of Object.keys(PRODUCTS)) delete PRODUCTS[key];
  for (const product of products) PRODUCTS[product.id] = Object.freeze({ ...product });
}

export default function RuntimePlanningBook() {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const response = await fetch("/api/product-catalog", {
          method: "GET",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.ok !== true || !Array.isArray(payload.products) || payload.products.length === 0) {
          throw new Error("runtime_product_catalog_unavailable");
        }
        replaceRuntimeProducts(payload.products);
        const module = await import("./PlanningBook.jsx");
        if (!cancelled) setComponent(() => module.default);
      } catch {
        if (!cancelled) setError("Não foi possível carregar o cardápio atualizado. Recarregue a página em alguns instantes.");
      }
    }

    boot();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f8f1e4", color: "#4b3024" }}>
        <section style={{ maxWidth: 560, textAlign: "center" }}>
          <h1>Cardápio temporariamente indisponível</h1>
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>Tentar novamente</button>
        </section>
      </main>
    );
  }

  if (!Component) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8f1e4", color: "#4b3024" }}>
        <strong>Carregando cardápio Roda Festa...</strong>
      </main>
    );
  }

  return <Component />;
}
