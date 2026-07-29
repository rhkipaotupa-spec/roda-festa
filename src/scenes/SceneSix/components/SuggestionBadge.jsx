function SuggestionBadge({ suggestion }) {
  if (!suggestion) {
    return null;
  }

  const accessibleText = [
    "Sugestão de consumo:",
    suggestion.quantity,
    suggestion.unit,
    suggestion.complement,
  ].join(" ");

  return (
    <aside
      className="scene-six__suggestion"
      aria-label={accessibleText}
    >
      <span
        className="scene-six__suggestion-symbol"
        aria-hidden="true"
      >
        ✦
      </span>

      <span className="scene-six__suggestion-label">
        Sugestão
      </span>

      <strong className="scene-six__suggestion-quantity">
        {suggestion.quantity}
      </strong>

      <span className="scene-six__suggestion-unit">
        {suggestion.unit}
      </span>

      <span className="scene-six__suggestion-complement">
        {suggestion.complement}
      </span>
    </aside>
  );
}

export default SuggestionBadge;