import "./ExpertCard.css";

export default function ExpertCard({
  title = "Especialista Roda Festa",
  eyebrow = "Planejando junto com você",
  children,
}) {
  return (
    <aside
      className="expert-card"
      aria-label="Orientação do Especialista Roda Festa"
    >
      <div
        className="expert-card__wheel"
        aria-hidden="true"
      >
        <span className="expert-card__wheel-center" />
        <span className="expert-card__wheel-spoke expert-card__wheel-spoke--one" />
        <span className="expert-card__wheel-spoke expert-card__wheel-spoke--two" />
        <span className="expert-card__wheel-spoke expert-card__wheel-spoke--three" />
        <span className="expert-card__wheel-spoke expert-card__wheel-spoke--four" />
      </div>

      <div className="expert-card__content">
        <span className="expert-card__eyebrow">
          {eyebrow}
        </span>

        <strong className="expert-card__title">
          {title}
        </strong>

        <div className="expert-card__message">
          {children}
        </div>
      </div>
    </aside>
  );
}