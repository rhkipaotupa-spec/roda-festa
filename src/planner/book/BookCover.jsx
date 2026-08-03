import {
  useState,
} from "react";

import "./BookCover.css";

export default function BookCover({
  onOpen,
}) {
  const [
    clientName,
    setClientName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    eventDate,
    setEventDate,
  ] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    onOpen?.({
      clientName: clientName.trim(),
      phone: phone.trim(),
      eventDate,
    });
  }

  const canOpen =
    clientName.trim() &&
    phone.trim() &&
    eventDate;

  return (
    <section className="book-cover">
      <div className="book-cover__book">
        <div
          className="book-cover__spine"
          aria-hidden="true"
        />

        <div className="book-cover__content">
          <header className="book-cover__header">
            <span className="book-cover__brand">
              Roda Festa
            </span>

            <span className="book-cover__ornament">
              ✦
            </span>

            <h1 className="book-cover__title">
              Meu Planejamento
            </h1>

            <p className="book-cover__subtitle">
              Toda grande festa começa com
              um bom planejamento.
            </p>
          </header>

          <form
            className="book-cover__form"
            onSubmit={handleSubmit}
          >
            <label className="book-cover__field">
              <span>Nome do cliente</span>

              <input
                type="text"
                value={clientName}
                onChange={(event) =>
                  setClientName(
                    event.target.value
                  )
                }
                autoComplete="name"
                placeholder="Como podemos chamar você?"
              />
            </label>

            <label className="book-cover__field">
              <span>Telefone</span>

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

            <label className="book-cover__field">
              <span>Data do evento</span>

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
              className="book-cover__button"
              disabled={!canOpen}
            >
              <span>
                Abrir Caderno
              </span>

              <span
                className="book-cover__button-wheel"
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
                <span />
              </span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}