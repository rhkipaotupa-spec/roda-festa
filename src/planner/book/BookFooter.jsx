export default function BookFooter({
  currentSheet = "briefing",
  canGoBack = false,
  onBack,
  onRestart,
}) {
  if (currentSheet === "briefing") return null;

  return (
    <footer className="book-footer">
      <button type="button" disabled={!canGoBack} onClick={onBack}>
        <span aria-hidden="true">←</span>
        Voltar
      </button>

      <span className="book-footer__current">
        {currentSheet === "suggestion" && "Sugestão"}
        {currentSheet === "station" && "Detalhes da estação"}
        {currentSheet === "customization" && "Personalização"}
        {currentSheet === "summary" && "Resumo final"}
      </span>

      <button type="button" onClick={onRestart}>
        <span aria-hidden="true">↶</span>
        Refazer planejamento
      </button>
    </footer>
  );
}