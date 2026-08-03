import {
  useMemo,
  useState,
} from "react";

import "./BookIdentityPage.css";

export default function BookIdentityPage({
  initialData = {},
  onContinue,
}) {
  const [
    clientName,
    setClientName,
  ] = useState(
    initialData.clientName ?? ""
  );

  const [
    phone,
    setPhone,
  ] = useState(
    initialData.phone ?? ""
  );

  const [
    eventDate,
    setEventDate,
  ] = useState(
    initialData.eventDate ?? ""
  );

  const canContinue = useMemo(() => {
    return Boolean(
      clientName.trim() &&
      phone.trim() &&
      eventDate
    );
  }, [
    clientName,
    phone,
    eventDate,
  ]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!canContinue) {
      return;
    }

    onContinue?.({
      clientName: clientName.trim(),
      phone: phone.trim(),
      eventDate,
    });
  }

  return (
    <section
      className="book-identity-page"
      aria-label="Identificação do planejamento"
    >
      <div className="book-identity-page__book">
        <div
          className="book-identity-page__binding"
          aria-hidden="true"
        />

        <article className="book-identity-page__left-page">
          <header className="book-identity-page__header">
            <span className="book-identity-page__chapter">
              Primeiro capítulo
            </span>

            <h1 className="book-identity-page__title">
              Meu Planejamento
            </h1>

            <p className="book-identity-page__intro">
              Toda grande festa começa com
              um bom planejamento.
            </p>
          </header>

          <form
            className="book-identity-page__form"
            onSubmit={handleSubmit}
          >
            <label className="book-identity-page__field">
              <span>
                Este planejamento pertence a:
              </span>

              <input
                type="text"
                value={clientName}
                onChange={(event) =>
                  setClientName(
                    event.target.value
                  )
                }
                autoComplete="name"
                placeholder="Seu nome"
              />
            </label>

            <label className="book-identity-page__field">
              <span>
                Telefone para contato
              </span>

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                autoComplete="tel"
                placeholder="(00) 00000-0000"
              />
            </label>

            <label className="book-identity-page__field">
              <span>
                Data do evento
              </span>

              <input
                type="date"
                value={eventDate}
                onChange={(event) =>
                  setEventDate(
                    event.target.value
                  )
                }
              />
            </label>

            <button
              type="submit"
              className="book-identity-page__continue"
              disabled={!canContinue}
            >
              Continuar meu planejamento
            </button>
          </form>
        </article>

        <article className="book-identity-page__right-page">
          <div className="book-identity-page__summary">
            <span className="book-identity-page__summary-label">
              Meu Planejamento
            </span>

            <h2 className="book-identity-page__summary-name">
              {clientName.trim() ||
                "Seu nome será escrito aqui"}
            </h2>

            <div className="book-identity-page__summary-lines">
              <div>
                <span>Telefone</span>

                <strong>
                  {phone.trim() || "—"}
                </strong>
              </div>

              <div>
                <span>Data do evento</span>

                <strong>
                  {eventDate || "—"}
                </strong>
              </div>
            </div>
          </div>

          <footer className="book-identity-page__footer">
            Roda Festa · Comidinhas para sua festa
          </footer>
        </article>
      </div>
    </section>
  );
}