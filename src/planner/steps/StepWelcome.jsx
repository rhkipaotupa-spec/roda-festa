import welcomeArtwork from "../../assets/welcome-roda-festa-wide_clean.png";

import "./StepWelcome.css";

function WheelDivider() {
  return (
    <div
      className="step-welcome__divider"
      aria-hidden="true"
    >
      <span className="step-welcome__divider-line" />

      <span className="step-welcome__wheel">
        <span className="step-welcome__wheel-center" />

        <span className="step-welcome__wheel-spoke step-welcome__wheel-spoke--one" />

        <span className="step-welcome__wheel-spoke step-welcome__wheel-spoke--two" />

        <span className="step-welcome__wheel-spoke step-welcome__wheel-spoke--three" />

        <span className="step-welcome__wheel-spoke step-welcome__wheel-spoke--four" />
      </span>

      <span className="step-welcome__divider-line" />
    </div>
  );
}

export default function StepWelcome({
  isTransitioning = false,
  onStart,
}) {
  const sectionClassName = [
    "step-welcome",
    isTransitioning
      ? "step-welcome--transitioning"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  function handleStart() {
    if (isTransitioning) {
      return;
    }

    onStart?.();
  }

  return (
    <section
      className={sectionClassName}
      style={{
        "--welcome-artwork": `url("${welcomeArtwork}")`,
      }}
      aria-label="Boas-vindas ao planejamento da Roda Festa"
      aria-busy={isTransitioning}
    >
           <div
        className="step-welcome__background"
        aria-hidden="true"
      />

      <div
        className="step-welcome__ambient-light"
        aria-hidden="true"
      />

      <div
        className="step-welcome__outer-orbit"
        aria-hidden="true"
      />

      <div className="step-welcome__content">

        <span className="step-welcome__tagline">
          Gastronomia que encanta
        </span>

        <div
          className="step-welcome__brand-divider"
          aria-hidden="true"
        >
          <span />
          <strong>✦</strong>
          <span />
        </div>

        <span className="step-welcome__eyebrow">
          Seu evento começa aqui
        </span>

        <h1 className="step-welcome__title">
          <span>Vamos montar</span>

          <strong>sua festa?</strong>
        </h1>

        <div className="step-welcome__description">
          <p>
            <span>
              Em poucos minutos, prepararemos uma sugestão
            </span>

            <span>
              personalizada para o seu evento.
            </span>
          </p>

          <p>
            <span>
              Você poderá acrescentar, trocar ou retirar itens
            </span>

            <span>
              e acompanhar o investimento em tempo real.
            </span>
          </p>
        </div>

        <WheelDivider />

        <button
          type="button"
          className="step-welcome__button"
          onClick={handleStart}
          disabled={isTransitioning}
        >
          <span className="step-welcome__button-content">
            <span className="step-welcome__button-label">
              {isTransitioning
                ? "Preparando sua experiência"
                : "Começar meu planejamento"}
            </span>

          </span>
        </button>
      </div>

      <div
        className="step-welcome__opening-curtain"
        aria-hidden="true"
      />



      <div
        className="step-welcome__transition-glow"
        aria-hidden="true"
      />

      <div
        className="step-welcome__transition-curtain"
        aria-hidden="true"
      />

      <div
        className="step-welcome__loading"
        role="status"
        aria-live="polite"
        aria-hidden={!isTransitioning}
      >
        <span className="step-welcome__loading-eyebrow">
          Seu evento começa aqui
        </span>

        <strong className="step-welcome__loading-title">
          Preparando sua experiência
        </strong>

        <p className="step-welcome__loading-text">
          Montando os primeiros detalhes do seu evento...
        </p>

        <div
          className="step-welcome__loading-bar"
          aria-hidden="true"
        >
          <span />
        </div>

        <div
          className="step-welcome__loading-dots"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>
      </div>



    </section>
  );
}