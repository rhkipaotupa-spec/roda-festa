import { useMemo, useState } from "react";

import "./PlanningBook.css";

import useBookNavigation, {
  BOOK_SHEETS,
} from "./useBookNavigation";

import {
  Book,
  BookHeader,
  BookProgress,
  BookFooter,
  BookFlip,
} from "./book";

import {
  generatePlanningSuggestion,
} from "./engine/planningRules";

import {
  buildPlanningScene,
} from "./engine/buildPlanningScene";

import EventScene from "../scene/EventScene";

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

const ANALYSIS_DELAY = 760;

const STATION_META = {
  fried: {
    id: "fried",
    title: "Estação de Petiscos",
    description: "Frituras preparadas em pequenos lotes durante o evento.",
  },
  hotSandwiches: {
    id: "hotSandwiches",
    title: "Estação de Mini Lanches",
    description: "Mini lanches finalizados e servidos durante a festa.",
  },
  desserts: {
    id: "desserts",
    title: "Mesa de Doces e Bolo",
    description: "Composição de bolo e doces para completar a celebração.",
  },
  beverages: {
    id: "beverages",
    title: "Estação de Bebidas",
    description: "Bebidas em consignação, cobradas conforme o consumo.",
  },
};

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateValue) {
  if (!dateValue) return "Data a definir";

  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) return dateValue;

  return `${day}/${month}/${year}`;
}

function formatQuantity(item) {
  const quantity = Number(item?.quantity) || 0;

  if (item?.priceUnit === "kg" || item?.id === "bolo") {
    return `${quantity.toLocaleString("pt-BR", {
      maximumFractionDigits: 2,
    })} kg`;
  }

  return `${quantity.toLocaleString("pt-BR")} un.`;
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

function getStructureExplanation({ carts, equivalentGuests, duration }) {
  const cartText = carts === 1 ? "um carrinho" : `${carts} carrinhos`;

  return `Considerando ${equivalentGuests} convidados equivalentes e ${duration} horas de atendimento, recomendamos ${cartText} para manter a produção contínua e reduzir períodos de espera.`;
}

function getTeamExplanation({ preparers, waiters }) {
  const preparerText =
    preparers === 1
      ? "um profissional de preparo"
      : `${preparers} profissionais de preparo`;

  if (waiters > 0) {
    const waiterText = waiters === 1 ? "um garçom" : `${waiters} garçons`;
    return `A estrutura contará com ${preparerText} nos carrinhos e ${waiterText} para apoiar o atendimento aos convidados.`;
  }

  return `A estrutura contará com ${preparerText}, responsável pelo preparo e atendimento em cada estação. Garçons não foram incluídos nesta primeira sugestão.`;
}

function buildStations(items = [], includeBeverages = false) {
  const groups = new Map();

  items.forEach((item) => {
    let stationId = item.operationalGroup;

    if (stationId === "sweets" || stationId === "cake") {
      stationId = "desserts";
    }

    if (!STATION_META[stationId]) return;

    if (!groups.has(stationId)) {
      groups.set(stationId, {
        ...STATION_META[stationId],
        items: [],
      });
    }

    groups.get(stationId).items.push(item);
  });

  if (includeBeverages && !groups.has("beverages")) {
    groups.set("beverages", {
      ...STATION_META.beverages,
      items: [],
    });
  }

  return Array.from(groups.values());
}

export default function PlanningBook() {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [adults, setAdults] = useState(0);
  const [children, setChildren] = useState(0);
  const [duration, setDuration] = useState(4);
  const [includeWaiters, setIncludeWaiters] = useState(false);
  const [includeDisposables, setIncludeDisposables] = useState(false);
  const [includeBeverages, setIncludeBeverages] = useState(false);
  const [generatedSuggestion, setGeneratedSuggestion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(-1);

  const navigation = useBookNavigation();

  const equivalentGuests = useMemo(
    () => adults + children * 0.5,
    [adults, children]
  );

  const realGuests = adults + children;

  const selectedEventData =
    EVENT_OPTIONS.find((option) => option.id === selectedEvent) ?? null;

  const canGenerateSuggestion =
    Boolean(selectedEvent) && realGuests > 0 && !isAnalyzing;

  const stations = useMemo(
    () =>
      generatedSuggestion
        ? buildStations(generatedSuggestion.items, includeBeverages)
        : [],
    [generatedSuggestion, includeBeverages]
  );

  const selectedStation =
    stations.find((station) => station.id === navigation.selectedStation) ??
    null;

  const sceneResult = useMemo(() => {
    if (!generatedSuggestion) return null;

    return buildPlanningScene({
      suggestion: generatedSuggestion,
      eventType: selectedEvent,
    });
  }, [generatedSuggestion, selectedEvent]);

  const recommendation = generatedSuggestion
    ? {
        introduction: getEventIntroduction(selectedEvent),
        structure: getStructureExplanation({
          carts: generatedSuggestion.carts.totalCarts,
          equivalentGuests,
          duration,
        }),
        team: getTeamExplanation({
          preparers: generatedSuggestion.preparers,
          waiters: generatedSuggestion.waiters.quantity,
        }),
      }
    : null;

  function invalidateSuggestion() {
    if (isAnalyzing) return;
    setGeneratedSuggestion(null);
    setAnalysisStep(-1);
  }

  function handleAdultChange(value) {
    setAdults(Math.max(0, Number(value) || 0));
    invalidateSuggestion();
  }

  function handleChildrenChange(value) {
    setChildren(Math.max(0, Number(value) || 0));
    invalidateSuggestion();
  }

  async function handleGenerateSuggestion() {
    if (!canGenerateSuggestion) return;

    setGeneratedSuggestion(null);
    setAnalysisStep(-1);
    setIsAnalyzing(true);
    navigation.goToSuggestion();

    const suggestion = generatePlanningSuggestion({
      adults,
      children,
      serviceHours: duration,
      selectedProductIds: INITIAL_PRODUCT_IDS,
      includeWaiters,
      includeDisposables,
      includeBeverages,
    });

    for (let index = 0; index < ANALYSIS_STEPS.length; index += 1) {
      await wait(ANALYSIS_DELAY);
      setAnalysisStep(index);
    }

    await wait(520);
    setGeneratedSuggestion(suggestion);
    setIsAnalyzing(false);
  }

  function handleRestartPlanning() {
    const shouldRestart = window.confirm(
      "Deseja refazer o planejamento? As informações preenchidas serão apagadas."
    );

    if (!shouldRestart) return;

    setClientName("");
    setPhone("");
    setEventDate("");
    setSelectedEvent("");
    setAdults(0);
    setChildren(0);
    setDuration(4);
    setIncludeWaiters(false);
    setIncludeDisposables(false);
    setIncludeBeverages(false);
    setGeneratedSuggestion(null);
    setIsAnalyzing(false);
    setAnalysisStep(-1);
    navigation.restart();
  }

  function renderBriefing() {
    return (
      <>
        <header className="planning-book__header">
          <span className="planning-book__eyebrow">Meu planejamento</span>
          <h1 className="planning-book__title">Seu evento está tomando forma.</h1>
          <p className="planning-book__intro">
            Conte um pouco sobre sua festa. Nós transformaremos suas escolhas em
            uma primeira recomendação.
          </p>
        </header>

        <div className="planning-book__section">
          <span className="planning-book__chapter">Seus dados</span>
          <h2>Para quem estamos planejando?</h2>

          <label className="planning-book__field">
            <span>Nome</span>
            <input
              type="text"
              value={clientName}
              disabled={isAnalyzing}
              placeholder="Como podemos chamar você?"
              autoComplete="name"
              onChange={(event) => {
                setClientName(event.target.value);
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
                setPhone(event.target.value);
                invalidateSuggestion();
              }}
            />
          </label>

          <label className="planning-book__field">
            <span>Data do evento</span>
            <input
              type="date"
              value={eventDate}
              disabled={isAnalyzing}
              onChange={(event) => {
                setEventDate(event.target.value);
                invalidateSuggestion();
              }}
            />
          </label>
        </div>

        <div className="planning-book__section">
          <span className="planning-book__chapter">Perfil do evento</span>
          <h2>Qual será a ocasião?</h2>

          <div className="planning-book__event-options">
            {EVENT_OPTIONS.map((option) => {
              const isSelected = option.id === selectedEvent;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isAnalyzing}
                  className={[
                    "planning-book__event-option",
                    isSelected ? "planning-book__event-option--selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    setSelectedEvent(option.id);
                    invalidateSuggestion();
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="planning-book__section">
          <span className="planning-book__chapter">Convidados</span>
          <h2>Quantas pessoas participarão?</h2>

          <div className="planning-book__counter-row">
            <div>
              <strong>Adultos</strong>
              <span>Consumo integral</span>
            </div>

            <div className="planning-book__counter">
              <button type="button" onClick={() => handleAdultChange(adults - 1)}>
                −
              </button>
              <input
                type="number"
                min="0"
                max="500"
                inputMode="numeric"
                aria-label="Quantidade de adultos"
                title="Clique e digite a quantidade de adultos"
                value={adults}
                onFocus={(event) => event.target.select()}
                onChange={(event) => handleAdultChange(event.target.value)}
              />
              <button type="button" onClick={() => handleAdultChange(adults + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="planning-book__counter-row">
            <div>
              <strong>Crianças</strong>
              <span>Cada criança equivale a meio adulto</span>
            </div>

            <div className="planning-book__counter">
              <button
                type="button"
                onClick={() => handleChildrenChange(children - 1)}
              >
                −
              </button>
              <input
                type="number"
                min="0"
                max="500"
                inputMode="numeric"
                aria-label="Quantidade de crianças"
                title="Clique e digite a quantidade de crianças"
                value={children}
                onFocus={(event) => event.target.select()}
                onChange={(event) => handleChildrenChange(event.target.value)}
              />
              <button
                type="button"
                onClick={() => handleChildrenChange(children + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className="planning-book__equivalent">
            <span>Para o dimensionamento</span>
            <strong>{equivalentGuests} convidados equivalentes</strong>
          </div>
        </div>

        <div className="planning-book__section">
          <span className="planning-book__chapter">Duração</span>
          <h2>Por quanto tempo será a sua festa?</h2>

          <label className="planning-book__field">
            <span>Tempo de atendimento</span>
            <select
              value={duration}
              onChange={(event) => {
                setDuration(Number(event.target.value));
                invalidateSuggestion();
              }}
            >
              {[4, 5, 6, 7, 8].map((hours) => (
                <option key={hours} value={hours}>
                  {hours} horas
                </option>
              ))}
            </select>
          </label>

          <div className="planning-book__duration-notice">
            <span aria-hidden="true">i</span>
            <p>
              O pacote inclui 4 horas de atendimento. Acima desse período,
              haverá acréscimo por hora adicional, por carrinho e, quando
              houver, por garçom.
            </p>
          </div>
        </div>

        <div className="planning-book__section">
          <span className="planning-book__chapter">Serviços opcionais</span>
          <h2>O que deseja incluir?</h2>

          <div className="planning-book__choices">
            {[
              {
                checked: includeWaiters,
                setChecked: setIncludeWaiters,
                title: "Garçons",
                text: "Para atendimento e serviço nas mesas.",
              },
              {
                checked: includeDisposables,
                setChecked: setIncludeDisposables,
                title: "Descartáveis",
                text: "Pratos, copos, guardanapos e talheres.",
              },
              {
                checked: includeBeverages,
                setChecked: setIncludeBeverages,
                title: "Bebidas",
                text: "Em consignação, cobradas conforme o consumo.",
              },
            ].map((choice) => (
              <label key={choice.title} className="planning-book__choice">
                <input
                  type="checkbox"
                  checked={choice.checked}
                  onChange={(event) => {
                    choice.setChecked(event.target.checked);
                    invalidateSuggestion();
                  }}
                />
                <span>
                  <strong>{choice.title}</strong>
                  <small>{choice.text}</small>
                </span>
              </label>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderSuggestion() {
    if (isAnalyzing) {
      return (
        <div className="planning-book__analysis" aria-live="polite">
          <div className="planning-book__analysis-heading">
            <span>Interpretando suas escolhas</span>
            <div className="planning-book__analysis-pulse" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </div>

          <div className="planning-book__analysis-steps">
            {ANALYSIS_STEPS.map((step, index) => {
              const isCompleted = index <= analysisStep;
              const isCurrent = index === analysisStep + 1;

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
                  <span>{isCompleted ? "✓" : "•"}</span>
                  <p>{step}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (!generatedSuggestion || !recommendation) {
      return (
        <div className="planning-book__empty-recommendation">
          <span aria-hidden="true">✦</span>
          <h3>Esta folha será escrita especialmente para o seu evento.</h3>
          <p>Volte ao planejamento e gere uma nova sugestão.</p>
        </div>
      );
    }

    return (
      <div className="planning-book__recommendation">
        <div className="planning-book__recommendation-opening">
          <span>{clientName.trim() ? `Olá, ${clientName.trim()}.` : "Olá."}</span>
          <h3>
            Preparamos uma primeira sugestão para o seu{" "}
            {selectedEventData?.label.toLowerCase()}.
          </h3>
          <p>{recommendation.introduction}</p>
        </div>

        <section className="planning-book__recommendation-section">
          <span>Estrutura recomendada</span>
          <h4>
            {generatedSuggestion.carts.totalCarts}{" "}
            {generatedSuggestion.carts.totalCarts === 1 ? "carrinho" : "carrinhos"}
          </h4>
          <p>{recommendation.structure}</p>
        </section>

        <section className="planning-book__recommendation-section">
          <span>Equipe de atendimento</span>
          <h4>
            {generatedSuggestion.preparers}{" "}
            {generatedSuggestion.preparers === 1 ? "profissional" : "profissionais"}
            {generatedSuggestion.waiters.quantity > 0
              ? ` + ${generatedSuggestion.waiters.quantity} ${
                  generatedSuggestion.waiters.quantity === 1 ? "garçom" : "garçons"
                }`
              : ""}
          </h4>
          <p>{recommendation.team}</p>
        </section>

        <section className="planning-book__recommendation-section">
          <span>Serviços selecionados</span>

          <div className="planning-book__recommendation-tags">
            <em>{includeWaiters ? "✓ Garçons incluídos" : "— Sem garçons"}</em>
            <em>
              {includeDisposables
                ? "✓ Descartáveis incluídos"
                : "— Sem descartáveis"}
            </em>
            <em>
              {includeBeverages
                ? "✓ Bebidas em consignação"
                : "— Sem bebidas"}
            </em>
            <em>✓ {duration} horas de atendimento</em>
          </div>
        </section>

        <p className="planning-book__recommendation-signature">
          Cada detalhe pensado para tornar o seu momento inesquecível.
        </p>

        <section className="planning-book__stations">
          <div className="planning-book__stations-heading">
            <span>Estações sugeridas</span>
            <p>Abra cada estação para conferir produtos e quantidades.</p>
          </div>

          <div className="planning-book__station-cards">
            {stations.map((station) => (
              <button
                key={station.id}
                type="button"
                className="planning-book__station-card"
                onClick={() => navigation.goToStation(station.id)}
              >
                <span>{station.title}</span>
                <strong>{station.items.length} itens</strong>
                <small>Ver o que está incluso →</small>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderStation() {
    if (!selectedStation) {
      return (
        <div className="planning-book__empty-recommendation">
          <h3>Selecione uma estação.</h3>
          <button type="button" onClick={navigation.goBack}>
            ← Voltar à sugestão
          </button>
        </div>
      );
    }

    return (
      <div className="planning-book__station-sheet">
        <span className="planning-book__eyebrow">Estação selecionada</span>
        <h2>{selectedStation.title}</h2>
        <p>{selectedStation.description}</p>

        <div className="planning-book__station-items">
          {selectedStation.items.length > 0 ? (
            selectedStation.items.map((item) => (
              <div key={item.id} className="planning-book__station-item">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.commercialCategory}</span>
                </div>
                <b>{formatQuantity(item)}</b>
              </div>
            ))
          ) : (
            <p className="planning-book__station-empty">
              Os itens desta estação serão definidos na personalização.
            </p>
          )}
        </div>

        <button
          type="button"
          className="planning-book__primary-action"
          onClick={() => navigation.goToCustomization(selectedStation.id)}
        >
          Personalizar esta estação <span>→</span>
        </button>
      </div>
    );
  }

  function renderCustomization() {
    return (
      <div className="planning-book__customization-sheet">
        <span className="planning-book__eyebrow">Personalizar cardápio</span>
        <h2>{selectedStation?.title ?? "Estações do evento"}</h2>
        <p>
          A base de navegação já está pronta. Na próxima etapa, colocaremos aqui
          os controles para trocar, adicionar e ajustar quantidades.
        </p>

        <div className="planning-book__customization-preview">
          <span>Próxima evolução</span>
          <strong>Produtos, quantidades e investimento atualizados ao vivo.</strong>
        </div>

        <button
          type="button"
          className="planning-book__primary-action"
          onClick={navigation.goToSuggestion}
        >
          <span>←</span> Voltar à sugestão
        </button>
      </div>
    );
  }

  const isBriefing = navigation.currentSheet === BOOK_SHEETS.BRIEFING;

  const headerProps = {
    clientName,
    phone,
    eventDate,
    eventLabel: selectedEventData?.label ?? "Evento",
    adults,
    children,
    equivalentGuests,
    duration,
    includeWaiters,
    includeDisposables,
    includeBeverages,
  };

  function renderSheetHeader() {
    return (
      <header className="planning-book__summary-header">
        <span>
          {navigation.currentSheet === BOOK_SHEETS.SUGGESTION &&
            (isAnalyzing ? "Análise em andamento" : "Recomendação Roda Festa")}
          {navigation.currentSheet === BOOK_SHEETS.STATION &&
            "Detalhes da estação"}
          {navigation.currentSheet === BOOK_SHEETS.CUSTOMIZATION &&
            "Personalização"}
          {navigation.currentSheet === BOOK_SHEETS.BRIEFING &&
            "Aguardando suas escolhas"}
        </span>

        <h2>
          {navigation.currentSheet === BOOK_SHEETS.SUGGESTION &&
            (isAnalyzing ? "Preparando seu evento" : "Nossa sugestão")}
          {navigation.currentSheet === BOOK_SHEETS.STATION &&
            "O que está incluso"}
          {navigation.currentSheet === BOOK_SHEETS.CUSTOMIZATION &&
            "Seu cardápio"}
          {navigation.currentSheet === BOOK_SHEETS.BRIEFING &&
            "Seu planejamento"}
        </h2>
      </header>
    );
  }

  function renderDynamicSheet() {
    return (
      <>
        {renderSheetHeader()}

        <div className="planning-book__dynamic-sheet-content">
          {navigation.currentSheet === BOOK_SHEETS.BRIEFING && (
            <div className="planning-book__empty-recommendation">
              <span aria-hidden="true">✦</span>
              <h3>Esta folha será escrita especialmente para o seu evento.</h3>
              <p>
                Preencha as informações ao lado para receber uma sugestão
                inicial de estrutura, equipe, cardápio e investimento.
              </p>
            </div>
          )}

          {navigation.currentSheet === BOOK_SHEETS.SUGGESTION &&
            renderSuggestion()}

          {navigation.currentSheet === BOOK_SHEETS.STATION &&
            renderStation()}

          {navigation.currentSheet === BOOK_SHEETS.CUSTOMIZATION &&
            renderCustomization()}
        </div>
      </>
    );
  }

  return (
    <main className="planning-book">
      <section
        className={[
          "planning-book__book",
          `planning-book__book--sheet-${navigation.currentSheet}`,
          `planning-book__book--turn-${navigation.direction}`,
        ].join(" ")}
      >
        <Book
          currentSheet={navigation.currentSheet}
          direction={navigation.direction}
        >
          <article
            className={[
              "planning-book__questions",
              !isBriefing ? "planning-book__questions--context" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="planning-book__questions-scroll">
              {isBriefing ? (
                renderBriefing()
              ) : (
                <div className="planning-book__context-stack">
                  <BookHeader
                    {...headerProps}
                    onEdit={navigation.goToBriefing}
                    onRestart={handleRestartPlanning}
                  />

                  <BookProgress currentSheet={navigation.currentSheet} />
                </div>
              )}
            </div>

            {isBriefing && (
              <footer className="planning-book__questions-footer">
                {!canGenerateSuggestion && !isAnalyzing && (
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
                  <span aria-hidden="true">{isAnalyzing ? "•••" : "→"}</span>
                </button>
              </footer>
            )}
          </article>

          <article className="planning-book__summary">
            <BookFlip
              direction={navigation.direction}
              transitionKey={navigation.transitionKey}
            >
              {renderDynamicSheet()}
            </BookFlip>

            {generatedSuggestion && !isAnalyzing && !isBriefing && (
              <div className="planning-book__investment-footer">
                <div className="planning-book__recommendation-investment">
                  <span>Investimento inicial estimado</span>
                  <strong>
                    {formatCurrency(generatedSuggestion.investment.total)}
                  </strong>
                  <small>
                    Valor sujeito a ajustes conforme a personalização do
                    cardápio e dos serviços.
                  </small>
                </div>
              </div>
            )}

            <BookFooter
              currentSheet={navigation.currentSheet}
              canGoBack={navigation.canGoBack}
              onBack={navigation.goBack}
              onRestart={handleRestartPlanning}
            />
          </article>
        </Book>

        <aside
          className={[
            "planning-book__scene",
            `planning-book__scene--${selectedEvent || "neutral"}`,
            isAnalyzing ? "planning-book__scene--analyzing" : "",
            generatedSuggestion ? "planning-book__scene--ready" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="planning-book__event-scene" aria-hidden={!sceneResult}>
            {sceneResult ? (
              <EventScene plannerResult={sceneResult} />
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

            {!generatedSuggestion && !isAnalyzing && (
              <p>
                Conforme você responde, transformamos suas escolhas em uma
                primeira composição para o evento.
              </p>
            )}

            {generatedSuggestion && !isAnalyzing && (
              <>
                <div className="planning-book__scene-metrics">
                  <div>
                    <span>Convidados</span>
                    <strong>{realGuests}</strong>
                    <small>{equivalentGuests} equivalentes</small>
                  </div>
                  <div>
                    <span>Estrutura</span>
                    <strong>{generatedSuggestion.carts.totalCarts}</strong>
                    <small>
                      {generatedSuggestion.carts.totalCarts === 1
                        ? "carrinho"
                        : "carrinhos"}
                    </small>
                  </div>
                  <div>
                    <span>Duração</span>
                    <strong>{duration}h</strong>
                    <small>de atendimento</small>
                  </div>
                </div>

                <div className="planning-book__scene-caption">
                  <span>{selectedEventData?.label}</span>
                  {eventDate && <small>{formatDate(eventDate)}</small>}
                </div>
              </>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
