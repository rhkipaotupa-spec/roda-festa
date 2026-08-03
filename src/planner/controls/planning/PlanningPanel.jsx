import EventStep from "./EventStep";

import "./PlanningPanel.css";

export default function PlanningPanel({
  selectedEvent,
  isEventStepOpen,
  onSelectEvent,
  onEditEvent,
  children,
}) {
  return (
    <aside
      className="planning-panel"
      aria-label="Planejamento do evento"
    >
      <header className="planning-panel__header">
        <span className="planning-panel__eyebrow">
          Planejamento
        </span>

        <h1 className="planning-panel__title">
          Seu evento está tomando forma.
        </h1>
      </header>

      <div className="planning-panel__divider">
        <span className="planning-panel__divider-line" />

        <span
          className="planning-panel__wheel"
          aria-hidden="true"
        >
          <span className="planning-panel__wheel-center" />

          <span className="planning-panel__wheel-spoke planning-panel__wheel-spoke--one" />
          <span className="planning-panel__wheel-spoke planning-panel__wheel-spoke--two" />
          <span className="planning-panel__wheel-spoke planning-panel__wheel-spoke--three" />
          <span className="planning-panel__wheel-spoke planning-panel__wheel-spoke--four" />
        </span>

        <span className="planning-panel__divider-line" />
      </div>

      <section className="planning-panel__steps">
        <EventStep
          selectedEvent={selectedEvent}
          isOpen={isEventStepOpen}
          onSelectEvent={onSelectEvent}
          onEdit={onEditEvent}
        />

        {children}
      </section>
    </aside>
  );
}