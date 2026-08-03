import {
  useMemo,
  useState,
} from "react";

import "./PlanningBook.css";

import {
  generatePlanningSuggestion,
} from "./engine/planningRules";

import EventScene from "../scene/EventScene";

import {
  buildPlanningScene,
} from "./engine/buildPlanningScene";

const EVENT_OPTIONS = [
  {
    id: "infantil",
    label: "Festa Infantil",
    description:
      "Uma experiência acolhedora, descontraída e pensada para toda a família.",
  },
  {
    id: "casamento",
    label: "Casamento",
    description:
      "Uma composição elegante para celebrar um momento único.",
  },
  {
    id: "corporativo",
    label: "Evento Corporativo",
    description:
      "Atendimento organizado e adequado ao ambiente profissional.",
  },
];

const INITIAL_PRODUCT_IDS = [
  "pastel-carne",
  "pastel-queijo",
  "coxinha-frango-catupiry",
  "risoles-presunto-queijo",
  "mini-x-burguer",
  "brigadeiro-chocolate",
  "brigadeiro-leite-ninho",
  "bolo",
];

const ANALYSIS_STEPS = [
  "Entendendo o perfil do evento",
  "Interpretando o número de convidados",
  "Dimensionando a estrutura",
  "Organizando a equipe",
  "Montando o cardápio inicial",
  "Calculando o investimento",
  "Finalizando sua recomendação",
];

const ANALYSIS_DELAY = 440;

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] = dateValue.split("-");

  if (!year || !month || !day) {
    return dateValue;
  }

  return `${day}/${month}/${year}`;
}

function getEventIntroduction(eventId) {
  const texts = {
    infantil:
      "Para uma festa infantil, buscamos criar um atendimento leve, contínuo e confortável para adultos e crianças.",

    casamento:
      "Para um casamento, priorizamos uma apresentação elegante, atendimento fluido e uma experiência cuidadosa durante toda a celebração.",

    corporativo:
      "Para um evento corporativo, recomendamos uma operação objetiva, organizada e adequada ao ritmo dos convidados.",
  };

  return (
    texts[eventId] ??
    "Vamos dimensionar uma estrutura adequada ao perfil do seu evento."
  );
}

function getStructureExplanation({
  carts,
  equivalentGuests,
  duration,
}) {
  const cartText =
    carts === 1
      ? "um carrinho"
      : `${carts} carrinhos`;

  return `Considerando ${equivalentGuests} convidados equivalentes e ${duration} horas de atendimento, recomendamos ${cartText} para manter a produção contínua e reduzir períodos de espera.`;
}

function getTeamExplanation({
  preparers,
  waiters,
}) {
  const preparerText =
    preparers === 1
      ? "um profissional de preparo"
      : `${preparers} profissionais de preparo`;

  if (waiters > 0) {
    const waiterText =
      waiters === 1
        ? "um garçom"
        : `${waiters} garçons`;

    return `A estrutura contará com ${preparerText} nos carrinhos e ${waiterText} para apoiar o atendimento aos convidados.`;
  }

  return `A estrutura contará com ${preparerText}, responsável pelo preparo e atendimento em cada estação. Garçons não foram incluídos nesta primeira sugestão.`;
}

export default function PlanningBook() {
  const [
    clientName,
    setClientName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    eventDate,
    setEventDate,
  ] = useState("");

  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState("");

  const [
    adults,
    setAdults,
  ] = useState(0);

  const [
    children,
    setChildren,
  ] = useState(0);

  const [
    duration,
    setDuration,
  ] = useState(4);

  const [
    includeWaiters,
    setIncludeWaiters,
  ] = useState(false);

  const [
    includeDisposables,
    setIncludeDisposables,
  ] = useState(false);

  const [
    includeBeverages,
    setIncludeBeverages,
  ] = useState(false);

  const [
    generatedSuggestion,
    setGeneratedSuggestion,
  ] = useState(null);

  const [
    isAnalyzing,
    setIsAnalyzing,
  ] = useState(false);

  const [
    analysisStep,
    setAnalysisStep,
  ] = useState(-1);

  const equivalentGuests = useMemo(() => {
    return adults + children * 0.5;
  }, [
    adults,
    children,
  ]);

  const realGuests =
    adults + children;

  const selectedEventData =
    EVENT_OPTIONS.find(
      (option) =>
        option.id === selectedEvent
    ) ?? null;

  const canGenerateSuggestion =
    Boolean(selectedEvent) &&
    realGuests > 0 &&
    !isAnalyzing;

  function invalidateSuggestion() {
    if (isAnalyzing) {
      return;
    }

    setGeneratedSuggestion(null);
    setAnalysisStep(-1);
  }

  function handleAdultChange(value) {
    setAdults(
      Math.max(
        0,
        Number(value) || 0
      )
    );

    invalidateSuggestion();
  }

  function handleChildrenChange(value) {
    setChildren(
      Math.max(
        0,
        Number(value) || 0
      )
    );

    invalidateSuggestion();
  }

  async function handleGenerateSuggestion() {
    if (!canGenerateSuggestion) {
      return;
    }

    setGeneratedSuggestion(null);
    setAnalysisStep(-1);
    setIsAnalyzing(true);

    const suggestion =
      generatePlanningSuggestion({
        adults,
        children,
        serviceHours: duration,
        selectedProductIds:
          INITIAL_PRODUCT_IDS,
        includeWaiters,
        includeDisposables,
        includeBeverages,
      });

    for (
      let index = 0;
      index < ANALYSIS_STEPS.length;
      index += 1
    ) {
      await wait(ANALYSIS_DELAY);
      setAnalysisStep(index);
    }

    await wait(300);

    setGeneratedSuggestion(suggestion);
    setIsAnalyzing(false);
  }

  const sceneResult = useMemo(() => {
    if (!generatedSuggestion) {
      return null;
    }

    return buildPlanningScene({
      suggestion: generatedSuggestion,
      eventType: selectedEvent,
    });
  }, [
    generatedSuggestion,
    selectedEvent,
  ]);

  const recommendation =
    generatedSuggestion
      ? {
          introduction:
            getEventIntroduction(
              selectedEvent
            ),

          structure:
            getStructureExplanation({
              carts:
                generatedSuggestion
                  .carts.totalCarts,
              equivalentGuests,
              duration,
            }),

          team:
            getTeamExplanation({
              preparers:
                generatedSuggestion
                  .preparers,
              waiters:
                generatedSuggestion
                  .waiters.quantity,
            }),
        }
      : null;

  return (
    <main className="planning-book">
      <section className="planning-book__book">
        <div
          className="planning-book__binding"
          aria-hidden="true"
        />

        {/* ================================================
            PÁGINA 1 — INFORMAÇÕES DO CLIENTE
            ================================================ */}

        <article
          className={[
            "planning-book__questions",
            isAnalyzing
              ? "planning-book__questions--locked"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="planning-book__questions-scroll">
            <header className="planning-book__header">
            <span className="planning-book__eyebrow">
              Meu planejamento
            </span>

            <h1 className="planning-book__title">
              Seu evento está tomando forma.
            </h1>

            <p className="planning-book__intro">
              Conte um pouco sobre sua
              festa. Nós transformaremos
              suas escolhas em uma
              primeira recomendação.
            </p>
          </header>

          <div className="planning-book__section">
            <span className="planning-book__chapter">
              Seus dados
            </span>

            <h2>
              Para quem estamos planejando?
            </h2>

            <label className="planning-book__field">
              <span>Nome</span>

              <input
                type="text"
                value={clientName}
                disabled={isAnalyzing}
                placeholder="Como podemos chamar você?"
                autoComplete="name"
                onChange={(event) => {
                  setClientName(
                    event.target.value
                  );

                  invalidateSuggestion();
                }}
              />
            </label>

            <label className="planning-book__field">
              <span>Telefone</span>

              <input
                type="tel"
                value={phone}
                disabled={isAnalyzing}
                placeholder="(00) 00000-0000"
                autoComplete="tel"
                onChange={(event) => {
                  setPhone(
                    event.target.value
                  );

                  invalidateSuggestion();
                }}
              />
            </label>

            <label className="planning-book__field">
              <span>
                Data do evento
              </span>

              <input
                type="date"
                value={eventDate}
                disabled={isAnalyzing}
                onChange={(event) => {
                  setEventDate(
                    event.target.value
                  );

                  invalidateSuggestion();
                }}
              />
            </label>
          </div>

          <div className="planning-book__section">
            <span className="planning-book__chapter">
              Perfil do evento
            </span>

            <h2>
              Qual será a ocasião?
            </h2>

            <div className="planning-book__event-options">
              {EVENT_OPTIONS.map(
                (option) => {
                  const isSelected =
                    option.id ===
                    selectedEvent;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isAnalyzing}
                      className={[
                        "planning-book__event-option",
                        isSelected
                          ? "planning-book__event-option--selected"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => {
                        setSelectedEvent(
                          option.id
                        );

                        invalidateSuggestion();
                      }}
                    >
                      <strong>
                        {option.label}
                      </strong>

                      <span>
                        {
                          option.description
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="planning-book__section">
            <span className="planning-book__chapter">
              Convidados
            </span>

            <h2>
              Quantas pessoas participarão?
            </h2>

            <div className="planning-book__counter-row">
              <div>
                <strong>Adultos</strong>

                <span>
                  Consumo integral
                </span>
              </div>

              <div className="planning-book__counter">
                <button
                  type="button"
                  disabled={isAnalyzing}
                  aria-label="Diminuir adultos"
                  onClick={() =>
                    handleAdultChange(
                      adults - 1
                    )
                  }
                >
                  −
                </button>

                <input
                  type="number"
                  min="0"
                  max="500"
                  value={adults}
                  disabled={isAnalyzing}
                  aria-label="Quantidade de adultos"
                  onChange={(event) =>
                    handleAdultChange(
                      event.target.value
                    )
                  }
                />

                <button
                  type="button"
                  disabled={isAnalyzing}
                  aria-label="Aumentar adultos"
                  onClick={() =>
                    handleAdultChange(
                      adults + 1
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div className="planning-book__counter-row">
              <div>
                <strong>
                  Crianças
                </strong>

                <span>
                  Cada criança equivale
                  a meio adulto
                </span>
              </div>

              <div className="planning-book__counter">
                <button
                  type="button"
                  disabled={isAnalyzing}
                  aria-label="Diminuir crianças"
                  onClick={() =>
                    handleChildrenChange(
                      children - 1
                    )
                  }
                >
                  −
                </button>

                <input
                  type="number"
                  min="0"
                  max="500"
                  value={children}
                  disabled={isAnalyzing}
                  aria-label="Quantidade de crianças"
                  onChange={(event) =>
                    handleChildrenChange(
                      event.target.value
                    )
                  }
                />

                <button
                  type="button"
                  disabled={isAnalyzing}
                  aria-label="Aumentar crianças"
                  onClick={() =>
                    handleChildrenChange(
                      children + 1
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div className="planning-book__equivalent">
              <span>
                Para o dimensionamento
              </span>

              <strong>
                {equivalentGuests}{" "}
                {equivalentGuests === 1
                  ? "convidado equivalente"
                  : "convidados equivalentes"}
              </strong>
            </div>
          </div>

          <div className="planning-book__section">
            <span className="planning-book__chapter">
              Duração
            </span>

            <h2>
              Por quanto tempo será a sua festa?
            </h2>

            <label className="planning-book__field">
              <span>
                Tempo de atendimento
              </span>

              <select
                value={duration}
                disabled={isAnalyzing}
                onChange={(event) => {
                  setDuration(
                    Number(
                      event.target.value
                    )
                  );

                  invalidateSuggestion();
                }}
              >
                <option value={4}>
                  4 horas
                </option>

                <option value={5}>
                  5 horas
                </option>

                <option value={6}>
                  6 horas
                </option>

                <option value={7}>
                  7 horas
                </option>

                <option value={8}>
                  8 horas
                </option>
              </select>
            </label>
          </div>

          <div className="planning-book__section">
            <span className="planning-book__chapter">
              Serviços opcionais
            </span>

            <h2>
              O que deseja incluir?
            </h2>

            <div className="planning-book__choices">
              <label className="planning-book__choice">
                <input
                  type="checkbox"
                  checked={includeWaiters}
                  disabled={isAnalyzing}
                  onChange={(event) => {
                    setIncludeWaiters(
                      event.target.checked
                    );

                    invalidateSuggestion();
                  }}
                />

                <span>
                  <strong>
                    Garçons
                  </strong>

                  <small>
                    Para atendimento e
                    serviço nas mesas.
                  </small>
                </span>
              </label>

              <label className="planning-book__choice">
                <input
                  type="checkbox"
                  checked={
                    includeDisposables
                  }
                  disabled={isAnalyzing}
                  onChange={(event) => {
                    setIncludeDisposables(
                      event.target.checked
                    );

                    invalidateSuggestion();
                  }}
                />

                <span>
                  <strong>
                    Descartáveis
                  </strong>

                  <small>
                    Pratos, copos,
                    guardanapos e talheres.
                  </small>
                </span>
              </label>

              <label className="planning-book__choice">
                <input
                  type="checkbox"
                  checked={
                    includeBeverages
                  }
                  disabled={isAnalyzing}
                  onChange={(event) => {
                    setIncludeBeverages(
                      event.target.checked
                    );

                    invalidateSuggestion();
                  }}
                />

                <span>
                  <strong>
                    Bebidas
                  </strong>

                  <small>
                    Em consignação, cobradas
                    conforme o consumo.
                  </small>
                </span>
              </label>
            </div>
          </div>

          </div>

          <footer className="planning-book__questions-footer">
            {!canGenerateSuggestion &&
              !isAnalyzing && (
                <p className="planning-book__generate-hint">
                  Selecione a ocasião e informe ao menos um convidado.
                </p>
              )}

            <button
              type="button"
              className="planning-book__generate"
              disabled={!canGenerateSuggestion}
              onClick={handleGenerateSuggestion}
            >
              <span>
                {isAnalyzing
                  ? "Preparando a sugestão Roda Festa"
                  : "Gerar sugestão Roda Festa para meu evento"}
              </span>

              <span
                className={
                  isAnalyzing
                    ? "planning-book__loading-dots"
                    : ""
                }
                aria-hidden="true"
              >
                {isAnalyzing ? "•••" : "→"}
              </span>
            </button>
          </footer>
        </article>

        {/* ================================================
            PÁGINA 2 — RECOMENDAÇÃO DA RODA FESTA
            ================================================ */}

        <article className="planning-book__summary">
          <header className="planning-book__summary-header">
            <span>
              {isAnalyzing
                ? "Análise em andamento"
                : generatedSuggestion
                  ? "Recomendação Roda Festa"
                  : "Aguardando suas escolhas"}
            </span>

            <h2>
              Nossa sugestão
            </h2>
          </header>

          {!isAnalyzing &&
            !generatedSuggestion && (
              <div className="planning-book__empty-recommendation">
                <span aria-hidden="true">
                  ✦
                </span>

                <h3>
                  Esta página será escrita especialmente para o seu evento.
                </h3>

                <p>
                  Preencha as informações
                  ao lado para receber uma
                  sugestão inicial de
                  estrutura, equipe,
                  cardápio e investimento.
                </p>
              </div>
            )}

          {isAnalyzing && (
            <div
              className="planning-book__analysis"
              aria-live="polite"
            >
              <div className="planning-book__analysis-heading">
                <span>
                  Interpretando suas escolhas
                </span>

                <div
                  className="planning-book__analysis-pulse"
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <div className="planning-book__analysis-steps">
                {ANALYSIS_STEPS.map(
                  (step, index) => {
                    const isCompleted =
                      index <=
                      analysisStep;

                    const isCurrent =
                      index ===
                      analysisStep + 1;

                    return (
                      <div
                        key={step}
                        className={[
                          "planning-book__analysis-step",
                          isCompleted
                            ? "planning-book__analysis-step--completed"
                            : "",
                          isCurrent
                            ? "planning-book__analysis-step--current"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span
                          className="planning-book__analysis-icon"
                          aria-hidden="true"
                        >
                          {isCompleted
                            ? "✓"
                            : "•"}
                        </span>

                        <p>{step}</p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {!isAnalyzing &&
            generatedSuggestion &&
            recommendation && (
              <div className="planning-book__recommendation">
                <div className="planning-book__recommendation-opening">
                  <span>
                    {clientName.trim()
                      ? `Olá, ${clientName.trim()}.`
                      : "Olá."}
                  </span>

                  <h3>
                    Preparamos uma primeira
                    sugestão para o seu{" "}
                    {selectedEventData?.label.toLowerCase()}.
                  </h3>

                  <p>
                    {
                      recommendation.introduction
                    }
                  </p>
                </div>

                <section className="planning-book__recommendation-section">
                  <span>
                    Estrutura recomendada
                  </span>

                  <h4>
                    {
                      generatedSuggestion
                        .carts.totalCarts
                    }{" "}
                    {generatedSuggestion
                      .carts
                      .totalCarts === 1
                      ? "carrinho"
                      : "carrinhos"}
                  </h4>

                  <p>
                    {
                      recommendation.structure
                    }
                  </p>
                </section>

                <section className="planning-book__recommendation-section">
                  <span>
                    Equipe de atendimento
                  </span>

                  <h4>
                    {
                      generatedSuggestion
                        .preparers
                    }{" "}
                    {generatedSuggestion
                      .preparers === 1
                      ? "profissional"
                      : "profissionais"}
                    {generatedSuggestion
                      .waiters.quantity >
                    0
                      ? ` + ${generatedSuggestion.waiters.quantity} ${
                          generatedSuggestion
                            .waiters
                            .quantity === 1
                            ? "garçom"
                            : "garçons"
                        }`
                      : ""}
                  </h4>

                  <p>
                    {
                      recommendation.team
                    }
                  </p>
                </section>

                <section className="planning-book__recommendation-section">
                  <span>
                    Serviços selecionados
                  </span>

                  <div className="planning-book__recommendation-tags">
                    <em>
                      {includeDisposables
                        ? "Descartáveis incluídos"
                        : "Sem descartáveis"}
                    </em>

                    <em>
                      {includeBeverages
                        ? "Bebidas em consignação"
                        : "Sem bebidas"}
                    </em>

                    <em>
                      {duration} horas de
                      atendimento
                    </em>
                  </div>
                </section>

                <p className="planning-book__recommendation-signature">
                  Cada detalhe pensado para
                  tornar o seu momento
                  inesquecível.
                </p>
              </div>
            )}

          {generatedSuggestion &&
            !isAnalyzing && (
              <footer className="planning-book__investment-footer">
                <div className="planning-book__recommendation-investment">
                  <span>
                    Investimento inicial estimado
                  </span>

                  <strong>
                    {formatCurrency(
                      generatedSuggestion
                        .investment.total
                    )}
                  </strong>

                  <small>
                    Valor sujeito a ajustes conforme a personalização do cardápio e dos serviços.
                  </small>
                </div>

                <button
                  type="button"
                  className="planning-book__adjust"
                  onClick={() => {
                    setGeneratedSuggestion(null);
                    setAnalysisStep(-1);
                  }}
                >
                  ← Continuar planejando
                </button>
              </footer>
            )}
        </article>

        {/* ================================================
            ÁREA VISUAL — RESULTADO DO PLANEJAMENTO
            ================================================ */}

        <aside
          className={[
            "planning-book__scene",
            `planning-book__scene--${
              selectedEvent || "neutral"
            }`,
            isAnalyzing
              ? "planning-book__scene--analyzing"
              : "",
            generatedSuggestion
              ? "planning-book__scene--ready"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div
            className="planning-book__event-scene"
            aria-hidden={!sceneResult}
          >
            {sceneResult ? (
              <EventScene
                plannerResult={sceneResult}
              />
            ) : (
              <div className="planning-book__scene-placeholder">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <div className="planning-book__scene-overlay">
            <span>
              {isAnalyzing
                ? "Construindo a experiência"
                : generatedSuggestion
                  ? "Seu evento ganhou forma"
                  : "Visualização do planejamento"}
            </span>

            <h2>
              {isAnalyzing
                ? analysisStep < 2
                  ? "Entendendo o seu evento..."
                  : analysisStep < 4
                    ? "Dimensionando a estrutura..."
                    : analysisStep < 6
                      ? "Montando sua sugestão..."
                      : "Últimos detalhes..."
                : generatedSuggestion
                  ? "Uma estrutura pensada para receber bem."
                  : "Aqui, sua festa começará a ganhar vida."}
            </h2>

            {!generatedSuggestion &&
              !isAnalyzing && (
                <p>
                  Conforme você responde,
                  transformamos suas
                  escolhas em uma primeira
                  composição para o evento.
                </p>
              )}

            {generatedSuggestion &&
              !isAnalyzing && (
                <>
                  <div className="planning-book__scene-metrics">
                    <div>
                      <span>
                        Convidados
                      </span>

                      <strong>
                        {realGuests}
                      </strong>

                      <small>
                        {equivalentGuests} equivalentes
                      </small>
                    </div>

                    <div>
                      <span>
                        Estrutura
                      </span>

                      <strong>
                        {
                          generatedSuggestion
                            .carts.totalCarts
                        }
                      </strong>

                      <small>
                        {generatedSuggestion
                          .carts
                          .totalCarts === 1
                          ? "carrinho"
                          : "carrinhos"}
                      </small>
                    </div>

                    <div>
                      <span>
                        Duração
                      </span>

                      <strong>
                        {duration}h
                      </strong>

                      <small>
                        de atendimento
                      </small>
                    </div>
                  </div>

                  <div className="planning-book__scene-caption">
                    <span>
                      {selectedEventData?.label}
                    </span>

                    {eventDate && (
                      <small>
                        {formatDate(
                          eventDate
                        )}
                      </small>
                    )}
                  </div>

                  <button
                    type="button"
                    className="planning-book__personalize"
                  >
                    Personalizar cardápio
                    <span aria-hidden="true">
                      →
                    </span>
                  </button>
                </>
              )}
          </div>
        </aside>
      </section>
    </main>
  );
}