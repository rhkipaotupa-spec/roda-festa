function formatDate(value) {
  if (!value) return "Data a definir";
  const [year, month, day] = String(value).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export default function BookHeader({
  clientName = "",
  phone = "",
  eventDate = "",
  eventLabel = "Evento",
  adults = 0,
  children = 0,
  equivalentGuests = 0,
  duration = 4,
  includeWaiters = false,
  includeDisposables = false,
  includeBeverages = false,
  onEdit,
  onRestart,
}) {
  const totalGuests = Number(adults || 0) + Number(children || 0);

  return (
    <section className="book-header" aria-label="Resumo do evento">
      <div className="book-header__topline">
        <div className="book-header__title-block">
          <div>
            <span className="book-header__eyebrow">Seu evento</span>
            <h2>{eventLabel || "Evento"}</h2>
          </div>
        </div>

        <div className="book-header__actions">
          <button
            type="button"
            className="book-button book-button--secondary book-button--compact"
            onClick={onEdit}
          >
            <span aria-hidden="true">←</span>
            Editar informações
          </button>

          <button
            type="button"
            className="book-button book-button--ghost book-button--compact"
            onClick={onRestart}
          >
            <span aria-hidden="true">←</span>
            Refazer planejamento
          </button>
        </div>
      </div>

      <div className="book-header__identity">
        <div>
          <span>Cliente</span>
          <strong>{clientName.trim() || "Nome não informado"}</strong>
        </div>

        <div>
          <span>Telefone</span>
          <strong className="book-header__phone">
            {phone.trim() || "Não informado"}
          </strong>
        </div>

        <div>
          <span>Data</span>
          <strong>{formatDate(eventDate)}</strong>
        </div>
      </div>

      <div className="book-header__metrics">
        <div>
          <span>Convidados</span>
          <strong>{totalGuests}</strong>
          <small>{equivalentGuests} equivalentes</small>
        </div>

        <div>
          <span>Adultos</span>
          <strong>{adults}</strong>
        </div>

        <div>
          <span>Crianças</span>
          <strong>{children}</strong>
        </div>

        <div>
          <span>Duração</span>
          <strong>{duration}h</strong>
        </div>
      </div>

      <div className="book-header__services">
        <span className={includeWaiters ? "is-active" : ""}>
          {includeWaiters ? "✓" : "—"} Garçons
        </span>

        <span className={includeDisposables ? "is-active" : ""}>
          {includeDisposables ? "✓" : "—"} Descartáveis
        </span>

        <span className={includeBeverages ? "is-active" : ""}>
          {includeBeverages ? "✓" : "—"} Bebidas em consignação
        </span>
      </div>

      <div className="book-header__saved-note">
        <span className="book-header__saved-icon" aria-hidden="true">✓</span>

        <div>
          <strong>Seu planejamento está salvo</strong>
          <p>
            Clique no botão abaixo para conhecer nossa recomendação. Depois,
            personalize cada estação e ajuste os detalhes do seu evento.
          </p>
        </div>
      </div>
    </section>
  );
}
