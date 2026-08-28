import { useEffect, useMemo, useState } from "react";
import "./AdminAgenda.css";

const AGENDA_ENDPOINT = "/api/admin-agenda";
const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function pad2(value) {
  return String(value).padStart(2, "0");
}

function currentDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function currentMonthKey() {
  return currentDateKey().slice(0, 7);
}

function parseMonthKey(monthKey) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function monthRange(monthKey) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return null;
  const lastDay = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
  return {
    from: `${parsed.year}-${pad2(parsed.month)}-01`,
    to: `${parsed.year}-${pad2(parsed.month)}-${pad2(lastDay)}`,
    days: lastDay,
  };
}

function shiftMonth(monthKey, delta) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return currentMonthKey();
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

function monthTitle(monthKey) {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return "Agenda";
  const value = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)));
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function longDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return "Data selecionada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))));
}

function eventTypeLabel(value) {
  const normalized = String(value || "").trim().toUpperCase();
  const labels = {
    BIRTHDAY: "Aniversário",
    CHILD_BIRTHDAY: "Festa infantil",
    KIDS_BIRTHDAY: "Festa infantil",
    WEDDING: "Casamento",
    CORPORATE: "Corporativo",
    BABY_SHOWER: "Chá de bebê",
    CHA_DE_BEBE: "Chá de bebê",
  };
  if (labels[normalized]) return labels[normalized];
  if (!normalized) return "Evento";
  return normalized
    .toLocaleLowerCase("pt-BR")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

function agendaStage(event) {
  if (event?.history?.hasFinalProposal || event?.status === "FINALIZED") {
    return { label: "Proposta finalizada", className: "is-finalized" };
  }
  if (event?.status === "ABANDONED") {
    return { label: "Encerrado", className: "is-closed" };
  }
  if (event?.status === "EXPIRED") {
    return { label: "Expirado", className: "is-closed" };
  }
  return { label: "Em elaboração", className: "is-active" };
}

function buildCalendarCells(monthKey) {
  const parsed = parseMonthKey(monthKey);
  const range = monthRange(monthKey);
  if (!parsed || !range) return [];

  const leading = new Date(Date.UTC(parsed.year, parsed.month - 1, 1)).getUTCDay();
  const cells = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= range.days; day += 1) {
    cells.push(`${parsed.year}-${pad2(parsed.month)}-${pad2(day)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function AdminAgendaView({ onOpenQuote }) {
  const today = useMemo(() => currentDateKey(), []);
  const [monthKey, setMonthKey] = useState(() => currentMonthKey());
  const [selectedDate, setSelectedDate] = useState(() => currentDateKey());
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  const range = useMemo(() => monthRange(monthKey), [monthKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadAgenda() {
      if (!range) return;
      setStatus("loading");
      setError("");

      try {
        const response = await fetch(
          `${AGENDA_ENDPOINT}?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
          {
            method: "GET",
            credentials: "same-origin",
            headers: { Accept: "application/json" },
          },
        );
        const payload = await response.json().catch(() => null);
        if (cancelled) return;

        if (!response.ok || payload?.ok !== true || !Array.isArray(payload.events)) {
          setStatus("error");
          setError("Não foi possível carregar a agenda agora.");
          return;
        }

        setEvents(payload.events);
        setStatus("ready");

        setSelectedDate((current) => {
          if (current.startsWith(`${monthKey}-`)) return current;
          const firstEventDate = payload.events
            .map((event) => event?.event?.date)
            .find((date) => String(date || "").startsWith(`${monthKey}-`));
          return firstEventDate || range.from;
        });
      } catch {
        if (cancelled) return;
        setStatus("error");
        setError("Não foi possível carregar a agenda agora.");
      }
    }

    loadAgenda();
    return () => {
      cancelled = true;
    };
  }, [monthKey, range]);

  const eventsByDate = useMemo(() => {
    const grouped = new Map();
    for (const event of events) {
      const date = String(event?.event?.date || "").slice(0, 10);
      if (!date) continue;
      const list = grouped.get(date) || [];
      list.push(event);
      grouped.set(date, list);
    }
    return grouped;
  }, [events]);

  const calendarCells = useMemo(() => buildCalendarCells(monthKey), [monthKey]);
  const selectedEvents = eventsByDate.get(selectedDate) || [];
  const occupiedDays = eventsByDate.size;
  const multipleEventDays = [...eventsByDate.values()].filter((list) => list.length > 1).length;

  function moveMonth(delta) {
    const nextMonth = shiftMonth(monthKey, delta);
    setMonthKey(nextMonth);
    const currentToday = currentDateKey();
    setSelectedDate(currentToday.startsWith(`${nextMonth}-`) ? currentToday : `${nextMonth}-01`);
  }

  return (
    <div className="rf-admin-agenda">
      <section className="rf-admin-agenda__intro">
        <div>
          <span className="rf-admin-eyebrow">Visão operacional</span>
          <h2>As datas do mês em uma única leitura.</h2>
          <p>
            A Agenda organiza as datas já registradas nos orçamentos reais. Mais de um
            evento no mesmo dia aparece como atenção operacional, sem presumir sobreposição de horário.
          </p>
        </div>
        <div className="rf-admin-agenda__intro-mark" aria-hidden="true">31</div>
      </section>

      <section className="rf-admin-agenda__metrics" aria-label="Resumo da agenda mensal">
        <article>
          <span>Eventos no mês</span>
          <strong>{events.length}</strong>
          <small>Jornadas com data registrada neste intervalo.</small>
        </article>
        <article>
          <span>Datas com registros</span>
          <strong>{occupiedDays}</strong>
          <small>Datas que possuem pelo menos uma jornada com evento informado.</small>
        </article>
        <article>
          <span>Mais de um evento</span>
          <strong>{multipleEventDays}</strong>
          <small>Datas que merecem atenção operacional adicional.</small>
        </article>
      </section>

      <section className="rf-admin-agenda__board">
        <div className="rf-admin-calendar">
          <header className="rf-admin-calendar__toolbar">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Mês anterior">‹</button>
            <div>
              <span className="rf-admin-eyebrow">Calendário</span>
              <h2>{monthTitle(monthKey)}</h2>
            </div>
            <button type="button" onClick={() => moveMonth(1)} aria-label="Próximo mês">›</button>
          </header>

          <div className="rf-admin-calendar__weekdays" aria-hidden="true">
            {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>

          {status === "error" ? (
            <div className="rf-admin-agenda__state is-error" role="alert">{error}</div>
          ) : (
            <div className={`rf-admin-calendar__grid ${status === "loading" ? "is-loading" : ""}`}>
              {calendarCells.map((dateKey, index) => {
                if (!dateKey) {
                  return <span className="rf-admin-calendar-day is-empty" key={`empty-${index}`} />;
                }

                const dayEvents = eventsByDate.get(dateKey) || [];
                const isSelected = dateKey === selectedDate;
                const isToday = dateKey === today;
                const names = dayEvents.slice(0, 2).map((event) => event?.client?.name || "Cliente");

                return (
                  <button
                    type="button"
                    key={dateKey}
                    className={`rf-admin-calendar-day${dayEvents.length ? " has-events" : ""}${dayEvents.length > 1 ? " has-multiple" : ""}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                    onClick={() => setSelectedDate(dateKey)}
                    aria-pressed={isSelected}
                  >
                    <span className="rf-admin-calendar-day__number">{Number(dateKey.slice(-2))}</span>
                    {dayEvents.length ? (
                      <>
                        <span className="rf-admin-calendar-day__count">
                          {dayEvents.length} {dayEvents.length === 1 ? "evento" : "eventos"}
                        </span>
                        <span className="rf-admin-calendar-day__names">
                          {names.map((name, nameIndex) => <small key={`${name}-${nameIndex}`}>{name}</small>)}
                          {dayEvents.length > 2 ? <small>+{dayEvents.length - 2}</small> : null}
                        </span>
                      </>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="rf-admin-agenda-day" aria-label="Eventos da data selecionada">
          <header>
            <span className="rf-admin-eyebrow">Dia selecionado</span>
            <h2>{longDate(selectedDate)}</h2>
            <p>
              {selectedEvents.length === 0
                ? "Nenhum evento registrado nesta data."
                : `${selectedEvents.length} ${selectedEvents.length === 1 ? "evento registrado" : "eventos registrados"}.`}
            </p>
          </header>

          <div className="rf-admin-agenda-day__list">
            {status === "loading" ? (
              <div className="rf-admin-agenda__state" role="status">Carregando mês...</div>
            ) : null}

            {status === "ready" && selectedEvents.length === 0 ? (
              <div className="rf-admin-agenda__empty">
                <strong>Sem registros nesta data.</strong>
                <span>Nenhuma jornada com esta data aparece no intervalo consultado.</span>
              </div>
            ) : null}

            {status === "ready" ? selectedEvents.map((event) => {
              const stage = agendaStage(event);
              return (
                <button
                  type="button"
                  className="rf-admin-agenda-event"
                  key={event.sessionId}
                  onClick={() => onOpenQuote?.(event)}
                >
                  <span className={`rf-admin-agenda-event__stage ${stage.className}`}>{stage.label}</span>
                  <strong>{event?.client?.name || "Cliente ainda não identificado"}</strong>
                  <small>
                    {eventTypeLabel(event?.event?.type)} · {Number(event?.event?.guests || 0)} convidados
                  </small>
                  <small className="rf-admin-agenda-event__reference">Atendimento {event.sessionId}</small>
                  <span className="rf-admin-agenda-event__open">Ver orçamento <b aria-hidden="true">→</b></span>
                </button>
              );
            }) : null}
          </div>
        </aside>
      </section>
    </div>
  );
}
