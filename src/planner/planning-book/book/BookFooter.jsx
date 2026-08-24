export default function BookFooter({
  currentSheet = "briefing",
  canGoBack = false,
  onBack,
  onRecommendationHome,
  onSummary,
}) {
  if (currentSheet === "briefing") return null;

  const showContextNavigation = ["station", "customization", "summary"].includes(
    currentSheet
  );

  return (
    <footer className="book-footer">
      {showContextNavigation ? (
        <button
          type="button"
          className="book-button book-button--secondary book-button--compact"
          disabled={!canGoBack}
          onClick={onBack}
        >
          <span aria-hidden="true">←</span>
          Tela anterior
        </button>
      ) : (
        <span className="book-footer__spacer" aria-hidden="true" />
      )}

      <span className="book-footer__current">
        {currentSheet === "suggestion" && "Recomendação"}
        {currentSheet === "station" && "Detalhes da estação"}
        {currentSheet === "customization" && "Personalização"}
        {currentSheet === "summary" && "Resumo final"}
      </span>

      {currentSheet === "summary" ? (
        <button
          type="button"
          className="book-button book-button--ghost book-button--compact"
          onClick={onRecommendationHome}
        >
          <span aria-hidden="true">⌂</span>
          Voltar à recomendação
        </button>
      ) : (
        <button
          type="button"
          className="book-button book-button--ghost book-button--compact"
          onClick={onSummary}
        >
          <span aria-hidden="true">→</span>
          Ir para o resumo final
        </button>
      )}
    </footer>
  );
}
