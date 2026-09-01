import { useEffect, useMemo, useState } from "react";
import "./AdminWorkspace.css";
import "./AdminJourneyEnhancements.css";
import "./AdminQuoteHistory.css";

import AdminAgendaView from "./AdminAgendaView.jsx";
import AdminProductsView from "./AdminProductsView.jsx";
import AdminQuoteEditView from "./AdminQuoteEditView.jsx";
import "./AdminCommercialIntegrated.css";
import rodaFestaLogoCreme from "../planner/planning-book/assets/logo-roda-festa-creme.png";
import { groupQuotesByEventMonth } from "./adminQuoteHistory.js";
import {
  buildItemComparison,
  buildSelectedServices,
  buildServiceHistory,
  changeLabel,
  summarizeItemComparison,
} from "./adminJourneyPresentation.js";

const QUOTES_ENDPOINT = "/api/admin-quotes";
const QUOTE_LIFECYCLE_ENDPOINT = "/api/admin-quote-lifecycle";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value) {
  if (!value) return "Data a definir";
  const date = String(value).slice(0, 10);
  const parts = date.split("-");
  if (parts.length !== 3) return String(value);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTimestamp(value) {
  if (!value) return "Sem horário registrado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatQuantity(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  });
}

function formatMoneyDifference(recommended, finalValue) {
  if (finalValue == null) return "Ainda sem versão final";
  const difference = Number(finalValue || 0) - Number(recommended || 0);
  if (Math.abs(difference) < 0.005) return "Mesmo investimento da sugestão inicial";
  const direction = difference > 0 ? "Acréscimo de" : "Redução de";
  return `${direction} ${formatCurrency(Math.abs(difference))} em relação à sugestão`;
}

function quoteStage(quote) {
  if (quote?.history?.hasFinalProposal) {
    return { label: "Validado", className: "is-validated" };
  }
  return { label: "Sugestão", className: "is-suggestion" };
}

function initials(value) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "RF";
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function operatorRoleLabel(role) {
  const normalized = String(role || "").trim().toUpperCase();
  if (normalized === "OWNER") return "Responsável";
  if (normalized === "ADMIN") return "Administrador";
  return "Acesso administrativo";
}

function guestBreakdownText(event) {
  const adults = Number(event?.adults || 0);
  const olderChildren = Number(event?.olderChildren || 0);
  const children = Number(event?.children || 0);
  const detailedTotal = adults + olderChildren + children;
  if (detailedTotal === 0 && Number(event?.guests || 0) > 0) {
    return "Detalhamento por faixa não disponível neste registro.";
  }
  return `${adults} adultos · ${olderChildren} crianças 7+ · ${children} crianças 0–6`;
}

function changeSummaryText(summary) {
  if (!summary?.changed) return "Nenhum produto mudou entre a sugestão inicial e a versão final.";
  const parts = [];
  if (summary.increased) parts.push(`${summary.increased} aumentado${summary.increased === 1 ? "" : "s"}`);
  if (summary.reduced) parts.push(`${summary.reduced} reduzido${summary.reduced === 1 ? "" : "s"}`);
  if (summary.added) parts.push(`${summary.added} adicionado${summary.added === 1 ? "" : "s"}`);
  if (summary.removed) parts.push(`${summary.removed} retirado${summary.removed === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

function serviceStateLabel(service) {
  if (!service?.known) return "Não informado";
  return service.included ? "Incluído" : "Não incluído";
}

function serviceStateDetail(service) {
  if (!service?.known) return "Este registro histórico não preserva informação suficiente para afirmar o estado deste serviço.";
  if (!service.included) return "Não faz parte da versão enviada para validação.";
  if (service.service === "WAITERS") {
    const quantity = Number(service.quantity || 0);
    const team = quantity === 1 ? "1 garçom" : `${formatQuantity(quantity)} garçons`;
    return service.estimatedValue > 0 ? `${team} · ${formatCurrency(service.estimatedValue)}` : team;
  }
  return service.estimatedValue > 0
    ? `Pacote incluído · ${formatCurrency(service.estimatedValue)}`
    : "Pacote incluído na versão enviada.";
}

export default function AdminWorkspace({
  sessionMessage = "",
  operator = null,
  onLogout = null,
  isLoggingOut = false,
  logoutError = "",
  initialSection = "quotes",
  editSessionId = "",
}) {
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("idle");
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState(initialSection);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quoteView, setQuoteView] = useState("ACTIVE");
  const [operationState, setOperationState] = useState("idle");
  const [operationMessage, setOperationMessage] = useState("");
  const [expandedQuoteMonths, setExpandedQuoteMonths] = useState([]);

  const rawOperatorName = String(operator?.displayName || "").trim();
  const firstOperatorName = rawOperatorName.split(/\s+/).filter(Boolean)[0] || "";
  const operatorName = firstOperatorName
    ? firstOperatorName.charAt(0).toLocaleUpperCase("pt-BR") + firstOperatorName.slice(1).toLocaleLowerCase("pt-BR")
    : "Acesso administrativo";
  const operatorRole = operatorRoleLabel(operator?.role);

  useEffect(() => {
    let cancelled = false;
    async function loadQuotes() {
      try {
        const response = await fetch(`${QUOTES_ENDPOINT}?state=${encodeURIComponent(quoteView)}`, {
          method: "GET",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || payload?.ok !== true || !Array.isArray(payload.quotes)) {
          setStatus("error");
          setError("Não foi possível carregar os orçamentos agora.");
          return;
        }
        setQuotes(payload.quotes);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setError("Não foi possível carregar os orçamentos agora.");
      }
    }
    loadQuotes();
    return () => { cancelled = true; };
  }, [quoteView]);

  const filteredQuotes = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return quotes;
    return quotes.filter((quote) => [
      quote?.client?.name,
      quote?.client?.phone,
      quote?.client?.email,
      quote?.sessionId,
      quote?.status,
      quote?.event?.date,
    ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(term));
  }, [quotes, search]);

  const quoteGroups = useMemo(() => groupQuotesByEventMonth(filteredQuotes), [filteredQuotes]);
  const searchActive = Boolean(search.trim());
  const allQuoteMonthsExpanded = quoteGroups.length > 0
    && quoteGroups.every((group) => expandedQuoteMonths.includes(group.key));

  const metrics = useMemo(() => {
    const validated = quotes.filter((quote) => quote?.history?.hasFinalProposal).length;
    return { total: quotes.length, validated, suggestions: quotes.length - validated };
  }, [quotes]);

  const selectedComparison = useMemo(() => {
    if (!selectedQuote || selectedStatus !== "ready") return [];
    return buildItemComparison(selectedQuote?.recommendationSnapshot, selectedQuote?.finalProposalSnapshot);
  }, [selectedQuote, selectedStatus]);

  const selectedComparisonSummary = useMemo(() => summarizeItemComparison(selectedComparison), [selectedComparison]);
  const selectedServices = useMemo(() => {
    if (!selectedQuote || selectedStatus !== "ready") return [];
    return buildSelectedServices(selectedQuote?.finalProposalSnapshot);
  }, [selectedQuote, selectedStatus]);
  const selectedServiceHistory = useMemo(() => {
    if (!selectedQuote || selectedStatus !== "ready") return [];
    return buildServiceHistory(selectedQuote?.history?.changes);
  }, [selectedQuote, selectedStatus]);

  function switchSection(section) {
    setActiveSection(section);
    setMobileMenuOpen(false);
  }

  const sectionTitle = { quotes: "Orçamentos", agenda: "Agenda", products: "Produtos" }[activeSection] || "Admin";

  function requestLogout() {
    if (typeof onLogout !== "function" || isLoggingOut) return;
    setMobileMenuOpen(false);
    onLogout();
  }

  function switchQuoteView(nextView) {
    if (nextView === quoteView) return;
    setStatus("loading");
    setError("");
    setSearch("");
    setExpandedQuoteMonths([]);
    setOperationMessage("");
    setQuoteView(nextView);
  }

  function quoteMonthExpanded(key) {
    return searchActive || expandedQuoteMonths.includes(key);
  }

  function toggleQuoteMonth(key) {
    if (searchActive) return;
    setExpandedQuoteMonths((current) => current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]);
  }

  function expandAllQuoteMonths() {
    if (searchActive) return;
    setExpandedQuoteMonths(quoteGroups.map((group) => group.key));
  }

  function collapseAllQuoteMonths() {
    if (searchActive) return;
    setExpandedQuoteMonths([]);
  }

  async function openQuote(quote) {
    setSelectedQuote(quote);
    setSelectedStatus("loading");
    try {
      const response = await fetch(`${QUOTES_ENDPOINT}?id=${encodeURIComponent(quote.sessionId)}`, {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true || !payload.quote) {
        setSelectedStatus("error");
        return;
      }
      setSelectedQuote(payload.quote);
      setSelectedStatus("ready");
    } catch {
      setSelectedStatus("error");
    }
  }

  async function changeQuoteLifecycle(action) {
    const id = String(selectedQuote?.sessionId || "").trim();
    if (!id || operationState === "loading") return;
    if (action === "TRASH") {
      const confirmed = window.confirm("Mover este orçamento para a lixeira? O histórico será preservado e ele poderá ser restaurado.");
      if (!confirmed) return;
    }
    setOperationState("loading");
    setOperationMessage("");
    try {
      const response = await fetch(QUOTE_LIFECYCLE_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true || !payload?.lifecycle?.adminState) {
        setOperationMessage("Não foi possível atualizar este orçamento agora.");
        return;
      }
      const labels = {
        ARCHIVE: "Orçamento arquivado. O histórico foi preservado.",
        TRASH: "Orçamento movido para a lixeira. Ele pode ser restaurado.",
        RESTORE: "Orçamento restaurado para os ativos.",
      };
      setQuotes((current) => current.filter((quote) => quote?.sessionId !== id));
      setSelectedQuote(null);
      setSelectedStatus("idle");
      setOperationMessage(labels[action] || "Orçamento atualizado.");
    } catch {
      setOperationMessage("Não foi possível atualizar este orçamento agora.");
    } finally {
      setOperationState("idle");
    }
  }

  return (
    <main className="rf-admin-workspace">
      <aside className="rf-admin-sidebar">
        <div className="rf-admin-sidebar__brand">
          <img src={rodaFestaLogoCreme} alt="Roda Festa" />
          <div><span>Roda Festa</span><small>Área administrativa</small></div>
          <div className="rf-admin-mobile-session" aria-label={`Logado como ${operatorName}`}><small>Logado</small><strong>{operatorName}</strong></div>
          <button type="button" className="rf-admin-mobile-menu-trigger" aria-label="Abrir menu administrativo" aria-expanded={mobileMenuOpen} aria-controls="rf-admin-mobile-drawer" onClick={() => setMobileMenuOpen(true)}><span aria-hidden="true">☰</span></button>
        </div>

        <nav className="rf-admin-nav" aria-label="Navegação administrativa">
          <button type="button" className={activeSection === "quotes" ? "is-active" : ""} data-admin-section="quotes" aria-label="Orçamentos" onClick={() => setActiveSection("quotes")}><span>Orçamentos</span></button>
          <button type="button" className={activeSection === "agenda" ? "is-active" : ""} data-admin-section="agenda" aria-label="Agenda" onClick={() => setActiveSection("agenda")}><span>Agenda</span></button>
          <button type="button" className={activeSection === "products" ? "is-active" : ""} data-admin-section="products" aria-label="Produtos" onClick={() => switchSection("products")}><span>Produtos</span></button>
          <button type="button" disabled><span>Clientes</span><small>em breve</small></button>
          <button type="button" disabled><span>Aprendizados</span><small>em breve</small></button>
        </nav>

        <div className="rf-admin-sidebar__footer">
          <span>Sessão segura</span><strong>{operatorName}</strong><small>{operatorRole}</small>
          <small className="rf-admin-sidebar__session-note">{sessionMessage || "Acesso administrativo ativo"}</small>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <div className="rf-admin-mobile-drawer-layer" role="presentation">
          <button type="button" className="rf-admin-mobile-drawer__backdrop" aria-label="Fechar menu administrativo" onClick={() => setMobileMenuOpen(false)} />
          <aside id="rf-admin-mobile-drawer" className="rf-admin-mobile-drawer" aria-label="Menu administrativo">
            <header className="rf-admin-mobile-drawer__header">
              <div><span>Roda Festa</span><small>Área administrativa</small></div>
              <button type="button" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)}>×</button>
            </header>
            <nav className="rf-admin-mobile-drawer__nav">
              <button type="button" className={activeSection === "quotes" ? "is-active" : ""} onClick={() => switchSection("quotes")}><span>Orçamentos</span><small>Histórico, validação e revisões</small></button>
              <button type="button" className={activeSection === "agenda" ? "is-active" : ""} onClick={() => switchSection("agenda")}><span>Agenda</span><small>Datas e eventos</small></button>
              <button type="button" className={activeSection === "products" ? "is-active" : ""} onClick={() => switchSection("products")}><span>Produtos</span><small>Catálogo, preços e capacidades</small></button>
            </nav>
            <div className="rf-admin-mobile-drawer__operator"><span>Sessão ativa</span><strong>{operatorName}</strong><small>{operatorRole}</small></div>
            <button type="button" className="rf-admin-mobile-drawer__logout" onClick={requestLogout} disabled={isLoggingOut} aria-busy={isLoggingOut}>{isLoggingOut ? "Saindo..." : "Sair da conta"}</button>
          </aside>
        </div>
      ) : null}

      <section className="rf-admin-main">
        <header className="rf-admin-topbar">
          <div><span className="rf-admin-eyebrow">Painel Roda Festa</span><h1>{sectionTitle}</h1></div>
          <div className="rf-admin-topbar__actions">
            <div className="rf-admin-operator-chip" aria-label={`Acesso de ${operatorName}`}><span>{initials(operatorName)}</span><div><strong>{operatorName}</strong><small>{operatorRole}</small></div></div>
            <button type="button" className="rf-admin-logout" onClick={requestLogout} disabled={isLoggingOut} aria-busy={isLoggingOut}>{isLoggingOut ? "Saindo..." : "Sair"}</button>
            <a className="rf-admin-new-quote" href="/planning-book?admin=1&return=%2Fadmin"><span>+</span>Novo orçamento</a>
          </div>
        </header>

        {logoutError ? <p className="rf-admin-logout-error" role="alert" aria-live="polite">{logoutError}</p> : null}

        {editSessionId ? (
          <AdminQuoteEditView sessionId={editSessionId} embedded />
        ) : activeSection === "quotes" ? (
          <>
            <section className="rf-admin-hero">
              <div>
                <span className="rf-admin-eyebrow">Central de atendimento</span>
                <h2>Um lugar para acompanhar cada festa do primeiro cálculo à versão validada.</h2>
                <p>Sugestão do motor, alterações, proposta final e revisões administrativas ficam na mesma jornada.</p>
              </div>
              <div className="rf-admin-hero__ornament" aria-hidden="true">RF</div>
            </section>

            <section className="rf-admin-metrics" aria-label="Resumo dos orçamentos">
              <article><span>Total acompanhado</span><strong>{metrics.total}</strong><small className="rf-admin-metric-help">Todo orçamento que entrou no histórico, da sugestão inicial à versão final.</small></article>
              <article><span>Aguardando validação</span><strong>{metrics.suggestions}</strong><small className="rf-admin-metric-help">Tem sugestão do motor salva, mas ainda não chegou à proposta final.</small></article>
              <article><span>Validados</span><strong>{metrics.validated}</strong><small className="rf-admin-metric-help">Já têm proposta final concluída e podem receber revisões administrativas sem apagar a origem.</small></article>
            </section>

            <section className="rf-admin-board">
              <div className="rf-admin-board__toolbar">
                <div><span className="rf-admin-eyebrow">Histórico real</span><h2>{quoteView === "ACTIVE" ? "Orçamentos" : quoteView === "ARCHIVED" ? "Arquivados" : "Lixeira"}</h2></div>
                <div className="rf-admin-quote-views" aria-label="Organização dos orçamentos">
                  <button type="button" className={quoteView === "ACTIVE" ? "is-active" : ""} onClick={() => switchQuoteView("ACTIVE")}>Ativos</button>
                  <button type="button" className={quoteView === "ARCHIVED" ? "is-active" : ""} onClick={() => switchQuoteView("ARCHIVED")}>Arquivados</button>
                  <button type="button" className={quoteView === "TRASHED" ? "is-active" : ""} onClick={() => switchQuoteView("TRASHED")}>Lixeira</button>
                </div>
                <label className="rf-admin-search"><span>Buscar</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cliente, telefone, código..." /></label>
              </div>

              {status === "ready" && quoteGroups.length > 0 ? (
                <div className="rf-admin-quote-history-toolbar">
                  <span>{searchActive ? "A busca abriu automaticamente os meses com resultados." : "Agrupado pela data do evento para facilitar a visão dos próximos meses."}</span>
                  <div className="rf-admin-quote-history-toolbar__actions">
                    <button type="button" onClick={expandAllQuoteMonths} disabled={searchActive || allQuoteMonthsExpanded}>Expandir todos</button>
                    <button type="button" onClick={collapseAllQuoteMonths} disabled={searchActive || expandedQuoteMonths.length === 0}>Recolher todos</button>
                  </div>
                </div>
              ) : null}

              {status === "loading" ? <div className="rf-admin-empty" role="status">Carregando orçamentos reais...</div> : null}
              {status === "error" ? <div className="rf-admin-empty is-error" role="alert">{error}</div> : null}
              {status === "ready" && filteredQuotes.length === 0 ? (
                <div className="rf-admin-empty">
                  <strong>{quoteView === "ACTIVE" ? "Nenhum orçamento encontrado." : quoteView === "ARCHIVED" ? "Nenhum orçamento arquivado." : "A lixeira está vazia."}</strong>
                  <span>{quoteView === "ACTIVE" ? "Crie um novo orçamento no Planning Book ou ajuste sua busca." : quoteView === "ARCHIVED" ? "Os orçamentos arquivados aparecerão aqui e poderão ser restaurados." : "Orçamentos movidos para a lixeira continuarão preservados e poderão ser restaurados."}</span>
                </div>
              ) : null}
              {operationMessage ? <div className="rf-admin-operation-notice" role="status">{operationMessage}</div> : null}

              {status === "ready" && quoteGroups.length > 0 ? (
                <div className="rf-admin-quote-months">
                  {quoteGroups.map((group) => {
                    const expanded = quoteMonthExpanded(group.key);
                    return (
                      <section className={`rf-admin-quote-month ${expanded ? "is-expanded" : ""}`} key={group.key}>
                        <header className="rf-admin-quote-month__header">
                          <button type="button" className="rf-admin-quote-month__toggle" aria-expanded={expanded} onClick={() => toggleQuoteMonth(group.key)} disabled={searchActive}>
                            <span className="rf-admin-quote-month__chevron" aria-hidden="true">›</span>
                            <span className="rf-admin-quote-month__identity"><strong>{group.label}</strong><small>{group.total} orçamento{group.total === 1 ? "" : "s"}</small></span>
                          </button>
                          <div className="rf-admin-quote-month__summary">
                            <span>{group.validated} validado{group.validated === 1 ? "" : "s"}</span>
                            {group.pending > 0 ? <span>{group.pending} aguardando</span> : null}
                          </div>
                        </header>

                        {expanded ? (
                          <div className="rf-admin-quote-month__items">
                            {group.quotes.map((quote) => {
                              const stage = quoteStage(quote);
                              const name = quote?.client?.name || "Cliente ainda não identificado";
                              const canEdit = quoteView === "ACTIVE" && Boolean(quote?.history?.hasFinalProposal);
                              return (
                                <article className="rf-admin-quote-row" key={quote.sessionId}>
                                  <span className="rf-admin-quote-row__avatar" aria-hidden="true">{initials(name)}</span>
                                  <span className="rf-admin-quote-row__identity"><strong>{name}</strong><small>{formatDate(quote?.event?.date)} · {Number(quote?.event?.guests || 0)} convidados</small></span>
                                  <span className={`rf-admin-stage ${stage.className}`}>{stage.label}</span>
                                  <span className="rf-admin-quote-row__value"><strong>{formatCurrency(quote?.commercial?.effectiveTotal)}</strong><small>{quote?.commercial?.itemCount || 0} itens</small></span>
                                  <span className="rf-admin-quote-row__updated"><strong>Atualizado</strong><small>{formatTimestamp(quote?.updatedAt)}</small></span>
                                  <span className="rf-admin-quote-row__actions">
                                    <button type="button" className="rf-admin-quote-row__history" onClick={() => openQuote(quote)}>Histórico</button>
                                    {canEdit ? <a className="rf-admin-quote-row__edit" href={`/admin/orcamentos/${encodeURIComponent(quote.sessionId)}/editar`}>Editar orçamento</a> : null}
                                  </span>
                                </article>
                              );
                            })}
                          </div>
                        ) : null}
                      </section>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </>
        ) : activeSection === "agenda" ? (
          <AdminAgendaView onOpenQuote={openQuote} />
        ) : (
          <AdminProductsView embedded />
        )}
      </section>

      {selectedQuote ? (
        <div className="rf-admin-detail-layer" role="presentation">
          <button className="rf-admin-detail-layer__backdrop" type="button" aria-label="Fechar detalhes" onClick={() => setSelectedQuote(null)} />
          <aside className="rf-admin-detail" aria-label="Detalhes do orçamento">
            <header>
              <button type="button" className="rf-admin-detail__back" aria-label={`Voltar para ${activeSection === "agenda" ? "agenda" : "orçamentos"}`} onClick={() => setSelectedQuote(null)}>
                <svg className="rf-admin-detail__back-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 7 4 12l5 5" /><path d="M4 12h9a7 7 0 0 1 7 7" /></svg>
                <span className="rf-admin-detail__back-label">Voltar para {activeSection === "agenda" ? "agenda" : "orçamentos"}</span>
              </button>
              <button type="button" className="rf-admin-detail__close" aria-label="Fechar detalhes" onClick={() => setSelectedQuote(null)}>×</button>
              <span className="rf-admin-eyebrow">Orçamento</span>
              <h2>{selectedQuote?.client?.name || "Cliente"}</h2>
            </header>

            {selectedStatus === "loading" ? <div className="rf-admin-detail__state">Carregando histórico completo...</div> : null}
            {selectedStatus === "error" ? <div className="rf-admin-detail__state is-error">Não foi possível abrir este orçamento agora.</div> : null}

            {selectedStatus === "ready" ? (
              <div className="rf-admin-detail__content">
                <section className="rf-admin-detail__lifecycle" aria-label="Organização do orçamento">
                  <div><span>Organização</span><small>Nenhuma ação abaixo apaga o histórico definitivamente.</small></div>
                  <div className="rf-admin-detail__lifecycle-actions">
                    {(selectedQuote?.adminState || "ACTIVE") === "ACTIVE" && selectedQuote?.history?.hasFinalProposal ? <a className="rf-admin-detail__edit-quote" href={`/admin/orcamentos/${encodeURIComponent(selectedQuote.sessionId)}/editar`}>Editar orçamento</a> : null}
                    {(selectedQuote?.adminState || "ACTIVE") === "ACTIVE" ? <button type="button" disabled={operationState === "loading"} onClick={() => changeQuoteLifecycle("ARCHIVE")}>Arquivar</button> : <button type="button" disabled={operationState === "loading"} onClick={() => changeQuoteLifecycle("RESTORE")}>Restaurar</button>}
                    {(selectedQuote?.adminState || "ACTIVE") !== "TRASHED" ? <button type="button" className="is-trash" disabled={operationState === "loading"} onClick={() => changeQuoteLifecycle("TRASH")}>Mover para lixeira</button> : null}
                  </div>
                </section>

                <section className="rf-admin-detail__facts">
                  <article><span>Data</span><strong>{formatDate(selectedQuote?.event?.date)}</strong></article>
                  <article><span>Convidados</span><strong>{selectedQuote?.event?.guests || 0}</strong><small>{guestBreakdownText(selectedQuote?.event)}</small></article>
                  <article><span>Sugestão</span><strong>{formatCurrency(selectedQuote?.commercial?.recommendedTotal)}</strong><small>valor calculado originalmente pelo motor</small></article>
                  <article><span>Validado</span><strong>{selectedQuote?.commercial?.finalTotal == null ? "Ainda não" : formatCurrency(selectedQuote.commercial.finalTotal)}</strong><small>{formatMoneyDifference(selectedQuote?.commercial?.recommendedTotal, selectedQuote?.commercial?.finalTotal)}</small></article>
                </section>

                <section className="rf-admin-detail-section">
                  <div className="rf-admin-detail-section__heading"><span className="rf-admin-eyebrow">Leitura da jornada</span><h3>Da sugestão do motor à proposta final</h3><p>Aqui fica claro o que o sistema sugeriu primeiro, o que mudou durante a montagem e qual versão foi efetivamente validada.</p></div>
                  <div className="rf-admin-journey rf-admin-journey--explained">
                    <div><span className="rf-admin-journey__dot is-suggestion" /><p><strong>1. Sugestão do motor</strong><small>{selectedQuote?.recommendationSnapshot?.items?.length || 0} itens · {formatCurrency(selectedQuote?.commercial?.recommendedTotal)}</small><em>Ponto de partida calculado automaticamente para o cenário informado.</em></p></div>
                    <div><span className="rf-admin-journey__dot is-change" /><p><strong>2. Ajustes feitos</strong><small>{changeSummaryText(selectedComparisonSummary)}</small><em>O histórico completo preserva {selectedQuote?.history?.changeCount || 0} movimentações, incluindo serviços quando houver.</em></p></div>
                    <div><span className={`rf-admin-journey__dot ${selectedQuote?.history?.hasFinalProposal ? "is-validated" : "is-pending"}`} /><p><strong>3. Versão validada</strong><small>{selectedQuote?.history?.hasFinalProposal ? `${selectedQuote?.finalProposalSnapshot?.items?.length || 0} itens · ${formatCurrency(selectedQuote?.commercial?.finalTotal)}` : "Aguardando revisão"}</small><em>{selectedQuote?.history?.hasFinalProposal ? "É a composição final preservada como referência deste atendimento." : "Ainda não existe uma proposta final concluída para este orçamento."}</em></p></div>
                  </div>
                </section>

                <section className="rf-admin-detail-section">
                  <div className="rf-admin-detail-section__heading"><span className="rf-admin-eyebrow">Itens do orçamento</span><h3>Motor x versão final</h3><p>Esta comparação trata somente os produtos que pertencem ao domínio da recomendação do motor. Serviços opcionais escolhidos na edição aparecem separadamente logo abaixo.</p></div>
                  {selectedComparison.length > 0 ? (
                    <div className="rf-admin-item-comparison">
                      <div className="rf-admin-item-comparison__header" aria-hidden="true"><span>Item</span><span>Motor</span><span>Final</span><span>Resultado</span></div>
                      {selectedComparison.map((item) => (
                        <article className="rf-admin-item-comparison__row" key={item.id}>
                          <div className="rf-admin-item-comparison__identity"><strong>{item.name}</strong><small>{item.category}{item.consignment ? " · consignação" : ""}</small></div>
                          <div className="rf-admin-item-comparison__quantity"><span>Motor</span><strong>{formatQuantity(item.before)}</strong></div>
                          <div className="rf-admin-item-comparison__quantity"><span>Final</span><strong>{formatQuantity(item.after)}</strong></div>
                          <div className={`rf-admin-change-badge is-${item.change}`}><strong>{changeLabel(item.change)}</strong>{item.delta !== 0 ? <small>{item.delta > 0 ? "+" : ""}{formatQuantity(item.delta)}</small> : null}</div>
                        </article>
                      ))}
                    </div>
                  ) : <div className="rf-admin-detail-empty">Este orçamento ainda não possui produtos preservados para comparação.</div>}
                </section>

                <section className="rf-admin-detail-section">
                  <div className="rf-admin-detail-section__heading"><span className="rf-admin-eyebrow">Escolhas adicionais</span><h3>Serviços escolhidos</h3><p>Aqui aparece o estado que efetivamente chegou na versão enviada. Garçons e descartáveis são opções da edição, não recomendações do motor.</p></div>
                  {selectedQuote?.finalProposalSnapshot ? (
                    <div className="rf-admin-service-state">
                      {selectedServices.map((service) => (
                        <article className="rf-admin-service-state__card" key={service.id}>
                          <span>Serviço opcional</span><strong>{service.name}</strong>
                          <div className={`rf-admin-service-state__badge ${!service.known ? "is-unknown" : service.included ? "is-included" : "is-not-included"}`}>{serviceStateLabel(service)}</div>
                          <small>{serviceStateDetail(service)}</small>
                        </article>
                      ))}
                    </div>
                  ) : <div className="rf-admin-detail-empty">Os serviços serão consolidados quando existir uma versão final enviada.</div>}

                  <div className="rf-admin-service-history">
                    <span className="rf-admin-service-history__title">Histórico de serviços</span>
                    {selectedServiceHistory.length > 0 ? selectedServiceHistory.map((event) => (
                      <article className="rf-admin-service-history__row" key={event.id}><span>{event.sequence}</span><div><strong>{event.name}</strong><small>{formatTimestamp(event.recordedAt)}</small></div><span className={`rf-admin-service-history__action ${event.type === "SERVICE_ADDED" ? "is-added" : "is-removed"}`}>{event.action}</span></article>
                    )) : <div className="rf-admin-detail-empty">Nenhuma movimentação de serviços foi registrada nesta jornada.</div>}
                  </div>
                </section>

                <section className="rf-admin-detail__learning"><span>Base para aprendizado</span><p>Este histórico preserva o que o motor sugeriu, o que foi alterado nos produtos e quais serviços foram escolhidos antes da versão final. A calibração futura poderá comparar casos reais aprovados sem apagar a recomendação de origem.</p></section>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </main>
  );
}
