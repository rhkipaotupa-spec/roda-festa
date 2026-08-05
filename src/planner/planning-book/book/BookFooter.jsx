export default function BookFooter({
  currentSheet = "briefing",
  canGoBack = false,
  onBack,
  onRecommendationHome,
  onRestart,
}) {
  if (currentSheet === "briefing") return null;

  const isRecommendationHome = currentSheet === "suggestion";
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

      {isRecommendationHome ? (
        <button
          type="button"
          className="book-button book-button--ghost book-button--compact"
          onClick={onRestart}
        >
          <span aria-hidden="true">↶</span>
          Refazer planejamento
        </button>
      ) : (
        <button
          type="button"
          className="book-button book-button--ghost book-button--compact"
          onClick={onRecommendationHome}
        >
          <span aria-hidden="true">⌂</span>
          Voltar à recomendação
        </button>
      )}
    </footer>
  );
}
