import { useEffect, useMemo, useState } from "react";
import "./AdminCommercial.css";

const QUOTES_ENDPOINT = "/api/admin-quotes";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dateLabel(value) {
  const text = String(value || "");
  const [year, month, day] = text.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Data a definir";
}

export default function AdminQuoteEditIndex({ embedded = false } = {}) {
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState("loading");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`${QUOTES_ENDPOINT}?state=ACTIVE`, {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.ok !== true || !Array.isArray(payload.quotes)) {
          throw new Error("quotes_unavailable");
        }
        if (!cancelled) {
          setQuotes(payload.quotes.filter((quote) => quote?.history?.hasFinalProposal));
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return quotes;
    return quotes.filter((quote) => [
      quote?.client?.name,
      quote?.client?.phone,
      quote?.event?.date,
      quote?.sessionId,
    ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(term));
  }, [quotes, search]);

  return (
    <section className={embedded ? "rf-commercial-page rf-commercial-page--embedded" : "rf-commercial-page"}>
      <header className="rf-commercial-header">
        <div>
          <span>Roda Festa · Admin</span>
          <h1>{embedded ? "Pedidos validados" : "Editar pedido"}</h1>
          <p>Escolha uma proposta já validada. A versão original fica preservada e cada salvamento cria uma nova revisão administrativa.</p>
        </div>
        {!embedded ? (
          <div className="rf-commercial-header__actions">
            <a href="/admin">Voltar ao Admin</a>
            <a href="/admin/produtos">Produtos</a>
          </div>
        ) : null}
      </header>

      <section className="rf-commercial-list" style={{ maxWidth: 1240, margin: "0 auto" }}>
        <label className="rf-commercial-search">
          <span>Buscar pedido</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cliente, telefone, data ou código interno" />
        </label>

        {status === "loading" ? <p>Carregando pedidos...</p> : null}
        {status === "error" ? <p>Não foi possível carregar os pedidos agora.</p> : null}
        {status === "ready" && filtered.length === 0 ? <p>Nenhuma proposta validada encontrada.</p> : null}

        {status === "ready" ? filtered.map((quote) => (
          <article className="rf-product-row" key={quote.sessionId}>
            <div>
              <span>{dateLabel(quote?.event?.date)}</span>
              <strong>{quote?.client?.name || "Cliente"}</strong>
              <small>{Number(quote?.event?.guests || 0)} convidados · revisão admin {Number(quote?.adminCommercialRevision || 0)}</small>
            </div>
            <div className="rf-product-row__numbers">
              <span>{money(quote?.commercial?.effectiveTotal)}</span>
              <small>{quote?.commercial?.itemCount || 0} itens</small>
            </div>
            <div className="rf-product-row__actions">
              <a className="rf-commercial-link-button" href={`/admin/orcamentos/${encodeURIComponent(quote.sessionId)}/editar`}>Editar pedido</a>
            </div>
          </article>
        )) : null}
      </section>
    </section>
  );
}
