import "./EventStep.css";

const EVENT_OPTIONS = [
  {
    id: "infantil",
    title: "Festa Infantil",
    description:
      "Uma experiência leve, acolhedora e pensada para toda a família.",
  },
  {
    id: "casamento",
    title: "Casamento",
    description:
      "Uma composição elegante para celebrar um momento especial.",
  },
  {
    id: "corporativo",
    title: "Evento Corporativo",
    description:
      "Atendimento organizado e adequado ao ambiente profissional.",
  },
];

export default function EventStep({
  selectedEvent,
  isOpen,
  onSelectEvent,
  onEdit,
}) {
  const selectedOption =
    EVENT_OPTIONS.find(
      (option) => option.id === selectedEvent
    ) ?? null;

  if (!isOpen && selectedOption) {
    return (
      <section className="event-step event-step--summary">
        <div className="event-step__summary-content">
          <span
            className="event-step__summary-wheel"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
            <span />
          </span>

          <strong className="event-step__summary-value">
            {selectedOption.title}
          </strong>
        </div>

        <button
          type="button"
          className="event-step__edit"
          onClick={onEdit}
        >
          Editar
        </button>
      </section>
    );
  }

  return (
    <section className="event-step event-step--open">
      <header className="event-step__header">
        <span className="event-step__eyebrow">
          Primeiro passo
        </span>

        <h2 className="event-step__title">
          Qual será o seu evento?
        </h2>

        <p className="event-step__description">
          Cada ocasião possui uma dinâmica diferente.
          Conte para nós qual será a sua.
        </p>
      </header>

      <div className="event-step__options">
        {EVENT_OPTIONS.map((option) => {
          const isSelected =
            selectedEvent === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className={[
                "event-step__option",
                isSelected
                  ? "event-step__option--selected"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() =>
                onSelectEvent(option.id)
              }
              aria-pressed={isSelected}
            >
              <span className="event-step__option-title">
                {option.title}
              </span>

              <span className="event-step__option-description">
                {option.description}
              </span>

              <span
                className="event-step__option-line"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}