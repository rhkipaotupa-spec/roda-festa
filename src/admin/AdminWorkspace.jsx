import { useEffect, useMemo, useState } from "react";
import "./AdminWorkspace.css";
import "./AdminJourneyEnhancements.css";

import AdminAgendaView from "./AdminAgendaView.jsx";
import rodaFestaLogoCreme from "../planner/planning-book/assets/logo-roda-festa-creme.png";
import {
  buildItemComparison,
  buildSelectedServices,
  buildServiceHistory,
  changeLabel,
  summarizeItemComparison,
} from "./adminJourneyPresentation.js";

const QUOTES_ENDPOINT = "/api/admin-quotes";

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
    return {
      label: "Validado",
      className: "is-validated",
    };
  }

  return {
    label: "Sugestão",
    className: "is-suggestion",
  };
}

function initials(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

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
  if (!service?.known) {
    return "Este registro histórico não preserva informação suficiente para afirmar o estado deste serviço.";
  }

  if (!service.included) {
    return "Não faz parte da versão enviada para validação.";
  }

  if (service.service === "WAITERS") {
    const quantity = Number(service.quantity || 0);
    const team = quantity === 1 ? "1 garçom" : `${formatQuantity(quantity)} garçons`;
    return service.estimatedValue > 0
      ? `${team} · ${formatCurrency(service.estimatedValue)}`
      : team;
  }

  return service.estimatedValue > 0
    ? `Pacote incluído · ${formatCurrency(service.estimatedValue)}`
    : "Pacote incluído na versão enviada.";
}

export default function AdminWorkspace({ sessionMessage = "", operator = null }) {
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("idle");
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("quotes");

  const operatorName = String(operator?.displayName || "").trim() || "Acesso administrativo";
  const operatorRole = operatorRoleLabel(operator?.role);

  useEffect(() => {
    let cancelled = false;

    async function loadQuotes() {
      try {
        const response = await fetch(QUOTES_ENDPOINT, {
          method: "GET",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
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

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredQuotes = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return quotes;

    return quotes.filter((quote) => {
      const haystack = [
        quote?.client?.name,
        quote?.client?.phone,
        quote?.client?.email,
        quote?.sessionId,
        quote?.status,
        quote?.event?.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return haystack.includes(term);
    });
  }, [quotes, search]);

  const metrics = useMemo(() => {
    const validated = quotes.filter((quote) => quote?.history?.hasFinalProposal).length;
    const suggestions = quotes.length - validated;

    return {
      total: quotes.length,
      validated,
      suggestions,
    };
  }, [quotes]);

  const selectedComparison = useMemo(() => {
    if (!selectedQuote || selectedStatus !== "ready") return [];
    return buildItemComparison(
      selectedQuote?.recommendationSnapshot,
      selectedQuote?.finalProposalSnapshot,
    );
  }, [selectedQuote, selectedStatus]);

  const selectedComparisonSummary = useMemo(
    () => summarizeItemComparison(selectedComparison),
    [selectedComparison],
  );

  const selectedServices = useMemo(() => {
    if (!selectedQuote || selectedStatus !== "ready") return [];
    return buildSelectedServices(selectedQuote?.finalProposalSnapshot);
  }, [selectedQuote, selectedStatus]);

  const selectedServiceHistory = useMemo(() => {
    if (!selectedQuote || selectedStatus !== "ready") return [];
    return buildServiceHistory(selectedQuote?.history?.changes);
  }, [selectedQuote, selectedStatus]);

  async function openQuote(quote) {
    setSelectedQuote(quote);
    setSelectedStatus("loading");

    try {
      const response = await fetch(
        `${QUOTES_ENDPOINT}?id=${encodeURIComponent(quote.sessionId)}`,
        {
          method: "GET",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
        },
      );

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

  return (
    <main className="rf-admin-workspace">
      <aside className="rf-admin-sidebar">
        <div className="rf-admin-sidebar__brand">
          <img src={rodaFestaLogoCreme} alt="Roda Festa" />
          <div>
            <span>Roda Festa</span>
            <small>Área administrativa</small>
          </div>
        </div>

        <nav className="rf-admin-nav" aria-label="Navegação administrativa">
          <button
            type="button"
            className={activeSection === "quotes" ? "is-active" : ""}
            data-admin-section="quotes"
            aria-label="Orçamentos"
            onClick={() => setActiveSection("quotes")}
          >
            <span>Orçamentos</span>
            <small>{metrics.total}</small>
          </button>

          <button
            type="button"
            className={activeSection === "agenda" ? "is-active" : ""}
            data-admin-section="agenda"
            aria-label="Agenda"
            onClick={() => setActiveSection("agenda")}
          >
            <span>Agenda</span>
            <small>calendário</small>
          </button>

          <button type="button" disabled>
            <span>Clientes</span>
            <small>em breve</small>
          </button>

          <button type="button" disabled>
            <span>Aprendizados</span>
            <small>em breve</small>
          </button>
        </nav>

        <div className="rf-admin-sidebar__footer">
          <span>Sessão segura</span>
          <strong>{operatorName}</strong>
          <small>{operatorRole}</small>
          <small className="rf-admin-sidebar__session-note">
            {sessionMessage || "Acesso administrativo ativo"}
          </small>
        </div>
      </aside>

      <section className="rf-admin-main">
        <nav className="rf-admin-mobile-nav" aria-label="Navegação administrativa móvel">
          <button
            type="button"
            className={activeSection === "quotes" ? "is-active" : ""}
            onClick={() => setActiveSection("quotes")}
          >
            Orçamentos
          </button>
          <button
            type="button"
            className={activeSection === "agenda" ? "is-active" : ""}
            onClick={() => setActiveSection("agenda")}
          >
            Agenda
          </button>
        </nav>

        <header className="rf-admin-topbar">
          <div>
            <span className="rf-admin-eyebrow">Painel Roda Festa</span>
            <h1>{activeSection === "agenda" ? "Agenda" : "Orçamentos"}</h1>
          </div>

          <div className="rf-admin-topbar__actions">
            <div className="rf-admin-operator-chip" aria-label={`Acesso de ${operatorName}`}>
              <span>{initials(operatorName)}</span>
              <div>
                <strong>{operatorName}</strong>
                <small>{operatorRole}</small>
              </div>
            </div>

            <a
              className="rf-admin-new-quote"
              href="/planning-book?admin=1&return=%2Fadmin"
            >
              <span>+</span>
              Novo orçamento
            </a>
          </div>
        </header>

        {activeSection === "quotes" ? (
          <>
        <section className="rf-admin-hero">
          <div>
            <span className="rf-admin-eyebrow">Central de atendimento</span>
            <h2>Um lugar para acompanhar cada festa do primeiro cálculo à versão validada.</h2>
            <p>
              Sugestão do motor, alterações e proposta final ficam lado a lado
              para dar contexto às próximas decisões.
            </p>
          </div>

          <div className="rf-admin-hero__ornament" aria-hidden="true">
            RF
          </div>
        </section>

        <section className="rf-admin-metrics" aria-label="Resumo dos orçamentos">
          <article>
            <span>Total acompanhado</span>
            <strong>{metrics.total}</strong>
            <small className="rf-admin-metric-help">
              Todo orçamento que entrou no histórico, da sugestão inicial à versão final.
            </small>
          </article>
          <article>
            <span>Aguardando validação</span>
            <strong>{metrics.suggestions}</strong>
            <small className="rf-admin-metric-help">
              Tem sugestão do motor salva, mas ainda não chegou à proposta final.
            </small>
          </article>
          <article>
            <span>Validados</span>
            <strong>{metrics.validated}</strong>
            <small className="rf-admin-metric-help">
              Já têm proposta final concluída e preservada para consulta e aprendizado.
            </small>
          </article>
        </section>

        <section className="rf-admin-board">
          <div className="rf-admin-board__toolbar">
            <div>
              <span className="rf-admin-eyebrow">Histórico real</span>
              <h2>Orçamentos recentes</h2>
            </div>

            <label className="rf-admin-search">
              <span>Buscar</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cliente, telefone, código..."
              />
            </label>
          </div>

          {status === "loading" ? (
            <div className="rf-admin-empty" role="status">
              Carregando orçamentos reais...
            </div>
          ) : null}

          {status === "error" ? (
            <div className="rf-admin-empty is-error" role="alert">
              {error}
            </div>
          ) : null}

          {status === "ready" && filteredQuotes.length === 0 ? (
            <div className="rf-admin-empty">
              <strong>Nenhum orçamento encontrado.</strong>
              <span>
                Crie um novo orçamento no Planning Book ou ajuste sua busca.
              </span>
            </div>
          ) : null}

          {status === "ready" && filteredQuotes.length > 0 ? (
            <div className="rf-admin-quote-list">
              {filteredQuotes.map((quote) => {
                const stage = quoteStage(quote);
                const name = quote?.client?.name || "Cliente ainda não identificado";

                return (
                  <button
                    type="button"
                    className="rf-admin-quote-row"
                    key={quote.sessionId}
                    onClick={() => openQuote(quote)}
                  >
                    <span className="rf-admin-quote-row__avatar" aria-hidden="true">
                      {initials(name)}
                    </span>

                    <span className="rf-admin-quote-row__identity">
                      <strong>{name}</strong>
                      <small>
                        {formatDate(quote?.event?.date)}
                        {" · "}
                        {Number(quote?.event?.guests || 0)} convidados
                      </small>
                    </span>

                    <span className={`rf-admin-stage ${stage.className}`}>
                      {stage.label}
                    </span>

                    <span className="rf-admin-quote-row__value">
                      <strong>{formatCurrency(quote?.commercial?.effectiveTotal)}</strong>
                      <small>{quote?.commercial?.itemCount || 0} itens</small>
                    </span>

                    <span className="rf-admin-quote-row__updated">
                      <strong>Atualizado</strong>
                      <small>{formatTimestamp(quote?.updatedAt)}</small>
                    </span>

                    <span className="rf-admin-quote-row__arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>
          </>
        ) : (
          <AdminAgendaView onOpenQuote={openQuote} />
        )}
      </section>

      {selectedQuote ? (
        <div className="rf-admin-detail-layer" role="presentation">
          <button
            className="rf-admin-detail-layer__backdrop"
            type="button"
            aria-label="Fechar detalhes"
            onClick={() => setSelectedQuote(null)}
          />

          <aside
            className="rf-admin-detail"
            aria-label="Detalhes do orçamento"
          >
            <header>
              <button
                type="button"
                className="rf-admin-detail__close"
                onClick={() => setSelectedQuote(null)}
              >
                ×
              </button>

              <span className="rf-admin-eyebrow">Orçamento</span>
              <h2>{selectedQuote?.client?.name || "Cliente"}</h2>
              <p>{selectedQuote.sessionId}</p>
            </header>

            {selectedStatus === "loading" ? (
              <div className="rf-admin-detail__state">
                Carregando histórico completo...
              </div>
            ) : null}

            {selectedStatus === "error" ? (
              <div className="rf-admin-detail__state is-error">
                Não foi possível abrir este orçamento agora.
              </div>
            ) : null}

            {selectedStatus === "ready" ? (
              <div className="rf-admin-detail__content">
                <section className="rf-admin-detail__facts">
                  <article>
                    <span>Data</span>
                    <strong>{formatDate(selectedQuote?.event?.date)}</strong>
                  </article>
                  <article>
                    <span>Convidados</span>
                    <strong>{selectedQuote?.event?.guests || 0}</strong>
                    <small>{guestBreakdownText(selectedQuote?.event)}</small>
                  </article>
                  <article>
                    <span>Sugestão</span>
                    <strong>
                      {formatCurrency(selectedQuote?.commercial?.recommendedTotal)}
                    </strong>
                    <small>valor calculado originalmente pelo motor</small>
                  </article>
                  <article>
                    <span>Validado</span>
                    <strong>
                      {selectedQuote?.commercial?.finalTotal == null
                        ? "Ainda não"
                        : formatCurrency(selectedQuote.commercial.finalTotal)}
                    </strong>
                    <small>
                      {formatMoneyDifference(
                        selectedQuote?.commercial?.recommendedTotal,
                        selectedQuote?.commercial?.finalTotal,
                      )}
                    </small>
                  </article>
                </section>

                <section className="rf-admin-detail-section">
                  <div className="rf-admin-detail-section__heading">
                    <span className="rf-admin-eyebrow">Leitura da jornada</span>
                    <h3>Da sugestão do motor à proposta final</h3>
                    <p>
                      Aqui fica claro o que o sistema sugeriu primeiro, o que mudou
                      durante a montagem e qual versão foi efetivamente validada.
                    </p>
                  </div>

                  <div className="rf-admin-journey rf-admin-journey--explained">
                    <div>
                      <span className="rf-admin-journey__dot is-suggestion" />
                      <p>
                        <strong>1. Sugestão do motor</strong>
                        <small>
                          {selectedQuote?.recommendationSnapshot?.items?.length || 0} itens · {formatCurrency(
                            selectedQuote?.commercial?.recommendedTotal,
                          )}
                        </small>
                        <em>Ponto de partida calculado automaticamente para o cenário informado.</em>
                      </p>
                    </div>

                    <div>
                      <span className="rf-admin-journey__dot is-change" />
                      <p>
                        <strong>2. Ajustes feitos</strong>
                        <small>{changeSummaryText(selectedComparisonSummary)}</small>
                        <em>
                          O histórico completo preserva {selectedQuote?.history?.changeCount || 0} movimentações, incluindo serviços quando houver.
                        </em>
                      </p>
                    </div>

                    <div>
                      <span
                        className={`rf-admin-journey__dot ${
                          selectedQuote?.history?.hasFinalProposal
                            ? "is-validated"
                            : "is-pending"
                        }`}
                      />
                      <p>
                        <strong>3. Versão validada</strong>
                        <small>
                          {selectedQuote?.history?.hasFinalProposal
                            ? `${selectedQuote?.finalProposalSnapshot?.items?.length || 0} itens · ${formatCurrency(selectedQuote?.commercial?.finalTotal)}`
                            : "Aguardando revisão"}
                        </small>
                        <em>
                          {selectedQuote?.history?.hasFinalProposal
                            ? "É a composição final preservada como referência deste atendimento."
                            : "Ainda não existe uma proposta final concluída para este orçamento."}
                        </em>
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rf-admin-detail-section">
                  <div className="rf-admin-detail-section__heading">
                    <span className="rf-admin-eyebrow">Itens do orçamento</span>
                    <h3>Motor x versão final</h3>
                    <p>
                      Esta comparação trata somente os produtos que pertencem ao domínio
                      da recomendação do motor. Serviços opcionais escolhidos na edição
                      aparecem separadamente logo abaixo.
                    </p>
                  </div>

                  {selectedComparison.length > 0 ? (
                    <div className="rf-admin-item-comparison">
                      <div className="rf-admin-item-comparison__header" aria-hidden="true">
                        <span>Item</span>
                        <span>Motor</span>
                        <span>Final</span>
                        <span>Resultado</span>
                      </div>

                      {selectedComparison.map((item) => (
                        <article className="rf-admin-item-comparison__row" key={item.id}>
                          <div className="rf-admin-item-comparison__identity">
                            <strong>{item.name}</strong>
                            <small>
                              {item.category}
                              {item.consignment ? " · consignação" : ""}
                            </small>
                          </div>

                          <div className="rf-admin-item-comparison__quantity">
                            <span>Motor</span>
                            <strong>{formatQuantity(item.before)}</strong>
                          </div>

                          <div className="rf-admin-item-comparison__quantity">
                            <span>Final</span>
                            <strong>{formatQuantity(item.after)}</strong>
                          </div>

                          <div className={`rf-admin-change-badge is-${item.change}`}>
                            <strong>{changeLabel(item.change)}</strong>
                            {item.delta !== 0 ? (
                              <small>
                                {item.delta > 0 ? "+" : ""}{formatQuantity(item.delta)}
                              </small>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rf-admin-detail-empty">
                      Este orçamento ainda não possui produtos preservados para comparação.
                    </div>
                  )}
                </section>

                <section className="rf-admin-detail-section">
                  <div className="rf-admin-detail-section__heading">
                    <span className="rf-admin-eyebrow">Escolhas adicionais</span>
                    <h3>Serviços escolhidos</h3>
                    <p>
                      Aqui aparece o estado que efetivamente chegou na versão enviada.
                      Garçons e descartáveis são opções da edição, não recomendações do motor.
                    </p>
                  </div>

                  {selectedQuote?.finalProposalSnapshot ? (
                    <div className="rf-admin-service-state">
                      {selectedServices.map((service) => (
                        <article className="rf-admin-service-state__card" key={service.id}>
                          <span>Serviço opcional</span>
                          <strong>{service.name}</strong>
                          <div
                            className={`rf-admin-service-state__badge ${
                              !service.known
                                ? "is-unknown"
                                : service.included
                                  ? "is-included"
                                  : "is-not-included"
                            }`}
                          >
                            {serviceStateLabel(service)}
                          </div>
                          <small>{serviceStateDetail(service)}</small>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rf-admin-detail-empty">
                      Os serviços serão consolidados quando existir uma versão final enviada.
                    </div>
                  )}

                  <div className="rf-admin-service-history">
                    <span className="rf-admin-service-history__title">Histórico de serviços</span>

                    {selectedServiceHistory.length > 0 ? (
                      selectedServiceHistory.map((event) => (
                        <article className="rf-admin-service-history__row" key={event.id}>
                          <span>{event.sequence}</span>
                          <div>
                            <strong>{event.name}</strong>
                            <small>{formatTimestamp(event.recordedAt)}</small>
                          </div>
                          <span
                            className={`rf-admin-service-history__action ${
                              event.type === "SERVICE_ADDED" ? "is-added" : "is-removed"
                            }`}
                          >
                            {event.action}
                          </span>
                        </article>
                      ))
                    ) : (
                      <div className="rf-admin-detail-empty">
                        Nenhuma movimentação de serviços foi registrada nesta jornada.
                      </div>
                    )}
                  </div>
                </section>

                <section className="rf-admin-detail__learning">
                  <span>Base para aprendizado</span>
                  <p>
                    Este histórico preserva o que o motor sugeriu, o que foi
                    alterado nos produtos e quais serviços foram escolhidos antes da
                    versão final. A calibração futura poderá comparar casos reais
                    aprovados sem apagar a recomendação de origem.
                  </p>
                </section>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </main>
  );
}
