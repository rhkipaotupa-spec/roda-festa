export default function BookFooter({
  currentSheet = "briefing",
  canGoBack = false,
  onBack,
  onRestart,
}) {
  if (currentSheet === "briefing") return null;

  return (
    <footer className="book-footer">
      <button
        type="button"
        className="book-button book-button--secondary book-button--compact"
        disabled={!canGoBack}
        onClick={onBack}
      >
        <span aria-hidden="true">←</span>
        Voltar
      </button>

      <span className="book-footer__current">
        {currentSheet === "suggestion" && "Sugestão"}
        {currentSheet === "station" && "Detalhes da estação"}
        {currentSheet === "customization" && "Personalização"}
        {currentSheet === "summary" && "Resumo final"}
      </span>

      <button
        type="button"
        className="book-button book-button--ghost book-button--compact"
        onClick={onRestart}
      >
        <span aria-hidden="true">←</span>
        Refazer planejamento
      </button>
    </footer>
  );
}
