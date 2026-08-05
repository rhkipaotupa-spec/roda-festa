const DEFAULT_STEPS = [
  { id: "briefing", label: "Evento" },
  { id: "suggestion", label: "Sugestão" },
  { id: "station", label: "Estações" },
  { id: "customization", label: "Personalização" },
  { id: "summary", label: "Resumo" },
];

export default function BookProgress({
  currentSheet = "briefing",
  steps = DEFAULT_STEPS,
}) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentSheet)
  );

  return (
    <nav className="book-progress" aria-label="Etapas do planejamento">
      {steps.map((step, index) => {
        const isComplete = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <div
            key={step.id}
            className={[
              "book-progress__step",
              isComplete ? "is-complete" : "",
              isActive ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="book-progress__number">
              {isComplete ? "✓" : index + 1}
            </span>
            <span className="book-progress__label">{step.label}</span>
          </div>
        );
      })}
    </nav>
  );
}