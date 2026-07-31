import { useState } from "react";

const events = [
  {
    id: "infantil",
    title: "Aniversário infantil",
    description: "Celebrações leves, alegres e cheias de memória.",
    featured: true,
  },
  {
    id: "casamento",
    title: "Casamento",
    description: "Uma experiência elegante para um dia único.",
  },
  {
    id: "corporativo",
    title: "Evento corporativo",
    description: "Praticidade e cuidado em cada detalhe.",
  },
  {
    id: "outro",
    title: "Outro evento",
    description: "Conte para nós o que você está planejando.",
  },
];

function EventSelector() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const selectEvent = (eventId) => {
    setSelectedEvent(eventId);
  };

  const featuredEvent = events.find((event) => event.featured);
  const secondaryEvents = events.filter((event) => !event.featured);

  return (
    <section className="event-selector">
      <div className="event-selector__heading">
        <span>Primeiro, conte para nós...</span>

        <h2>Qual será o seu evento?</h2>

        <p>
          Escolha a opção que mais combina com o momento que você está
          planejando.
        </p>
      </div>

      <div className="event-selector__editorial-grid">
        <button
          type="button"
          className={`event-card event-card--featured ${
            selectedEvent === featuredEvent.id
              ? "event-card--selected"
              : ""
          }`}
          onClick={() => selectEvent(featuredEvent.id)}
        >
          <div className="event-card__visual">
            <span className="event-card__index">01</span>

            <div className="event-card__visual-copy">
              <span>Mais escolhido</span>
              <strong>{featuredEvent.title}</strong>
            </div>
          </div>

          <div className="event-card__body">
            <div>
              <h3>{featuredEvent.title}</h3>
              <p>{featuredEvent.description}</p>
            </div>

            <span className="event-card__action">
              {selectedEvent === featuredEvent.id
                ? "Selecionado"
                : "Escolher"}
              <span aria-hidden="true">→</span>
            </span>
          </div>

          <span className="event-card__check" aria-hidden="true">
            ✓
          </span>
        </button>

        <div className="event-selector__secondary-grid">
          {secondaryEvents.map((event, index) => {
            const isSelected = selectedEvent === event.id;

            return (
              <button
                key={event.id}
                type="button"
                className={`event-card event-card--compact ${
                  isSelected ? "event-card--selected" : ""
                }`}
                onClick={() => selectEvent(event.id)}
              >
                <span className="event-card__compact-index">
                  {String(index + 2).padStart(2, "0")}
                </span>

                <div>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                </div>

                <span className="event-card__action">
                  {isSelected ? "Selecionado" : "Escolher"}
                  <span aria-hidden="true">→</span>
                </span>

                <span className="event-card__check" aria-hidden="true">
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default EventSelector;