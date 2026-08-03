import SmartNumberInput from "./components/SmartNumberInput";
import AccordionHint from "./components/AccordionHint";

import "./GuestStep.css";

export default function GuestStep({
  adults = 0,
  children = 0,
  isOpen = false,
  onChangeAdults,
  onChangeChildren,
  onEdit,
}) {
  const equivalentGuests =
    adults + children * 0.5;

  const equivalentLabel =
    equivalentGuests === 1
      ? "1 convidado equivalente"
      : `${equivalentGuests} convidados equivalentes`;

  if (!isOpen) {
    return (
      <section className="guest-step guest-step--summary">
        <div className="guest-step__summary-content">
          <span
            className="guest-step__summary-wheel"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
            <span />
          </span>

          <div className="guest-step__summary-copy">
            <strong className="guest-step__summary-value">
              {adults} adultos · {children} crianças
            </strong>

            <span className="guest-step__summary-equivalent">
              {equivalentLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="guest-step__edit"
          onClick={onEdit}
        >
          Editar
        </button>
      </section>
    );
  }

  return (
    <section className="guest-step guest-step--open">
      <header className="guest-step__header">
        <span className="guest-step__eyebrow">
          Segundo passo
        </span>

        <h2 className="guest-step__title">
          Quem estará presente?
        </h2>

        <p className="guest-step__description">
          Informe adultos e crianças para estimarmos
          o porte do evento.
        </p>
      </header>

      <div className="guest-step__counters">
        <div className="guest-step__counter">
          <div className="guest-step__counter-copy">
            <span className="guest-step__counter-label">
              Adultos
            </span>

            <span className="guest-step__counter-help">
              Consumo integral
            </span>
          </div>

          <SmartNumberInput
            value={adults}
            min={0}
            max={500}
            step={1}
            onChange={onChangeAdults}
            ariaLabel="Adultos"
          />
        </div>

        <div className="guest-step__counter">
          <div className="guest-step__counter-copy">
            <span className="guest-step__counter-label">
              Crianças
            </span>

            <span className="guest-step__counter-help">
              Consumo proporcional
            </span>
          </div>

          <SmartNumberInput
            value={children}
            min={0}
            max={500}
            step={1}
            onChange={onChangeChildren}
            ariaLabel="Crianças"
          />
        </div>
      </div>

      <div className="guest-step__equivalent">
        <div className="guest-step__equivalent-heading">
          <span className="guest-step__equivalent-symbol">
            ≈
          </span>

          <div>
            <span className="guest-step__equivalent-label">
              Nosso entendimento
            </span>

            <strong className="guest-step__equivalent-value">
              {equivalentLabel}
            </strong>
          </div>
        </div>

        <AccordionHint label="Como calculamos?">
          <p>
            Para a estimativa inicial, cada criança
            equivale a aproximadamente meio adulto.
          </p>

          <p>
            Essa proporção nos ajuda a calcular
            quantidades e estrutura com mais segurança.
          </p>
        </AccordionHint>
      </div>
    </section>
  );
}