import {
  useState,
} from "react";

import PlanningPanel from "../controls/planning/PlanningPanel";
import GuestStep from "../controls/planning/GuestStep";
import ExpertCard from "../controls/planning/components/ExpertCard";

export default function PlanningSandbox() {
  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState(null);

  const [
    isEventStepOpen,
    setIsEventStepOpen,
  ] = useState(true);

  const [
    isGuestStepOpen,
    setIsGuestStepOpen,
  ] = useState(false);

  const [
    adults,
    setAdults,
  ] = useState(0);

  const [
    children,
    setChildren,
  ] = useState(0);

  function handleSelectEvent(eventType) {
    setSelectedEvent(eventType);
    setIsEventStepOpen(false);
    setIsGuestStepOpen(true);
  }

  function handleEditEvent() {
    setIsEventStepOpen(true);
    setIsGuestStepOpen(false);
  }

  function handleEditGuests() {
    setIsEventStepOpen(false);
    setIsGuestStepOpen(true);
  }

  const equivalentGuests =
    adults + children * 0.5;

  const hasGuestInformation =
    adults > 0 || children > 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns:
          "minmax(380px, 460px) 1fr",
        background: "#120804",
      }}
    >
      <PlanningPanel
        selectedEvent={selectedEvent}
        isEventStepOpen={isEventStepOpen}
        onSelectEvent={handleSelectEvent}
        onEditEvent={handleEditEvent}
      >
        {selectedEvent && (
          <GuestStep
            adults={adults}
            children={children}
            isOpen={isGuestStepOpen}
            onChangeAdults={setAdults}
            onChangeChildren={setChildren}
            onEdit={handleEditGuests}
          />
        )}

        {selectedEvent &&
          hasGuestInformation && (
            <ExpertCard>
              <p>
                Já conseguimos entender o porte
                do seu evento.
              </p>

              <p>
                Agora vamos descobrir quanto tempo
                essa experiência irá durar para
                calcular a estrutura ideal.
              </p>
            </ExpertCard>
          )}
      </PlanningPanel>

      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "40px",
          overflow: "hidden",
          color: "#f1d8b1",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "min(560px, 100%)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "block",
              marginBottom: "14px",
              fontFamily: "Arial, sans-serif",
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#c28a38",
            }}
          >
            Área de desenvolvimento
          </span>

          <h1
            style={{
              margin: 0,
              fontSize:
                "clamp(38px, 5vw, 72px)",
              fontWeight: 400,
              lineHeight: 1,
            }}
          >
            Planning Panel
          </h1>

          <p
            style={{
              margin: "20px 0 0",
              fontFamily: "Arial, sans-serif",
              fontSize: "16px",
              lineHeight: 1.6,
              color:
                "rgba(241, 216, 177, 0.72)",
            }}
          >
            Esta página existe apenas para validar
            o novo painel sem alterar a Welcome ou
            o fluxo principal.
          </p>

          <div
            style={{
              marginTop: "28px",
              padding: "20px 24px",
              border:
                "1px solid rgba(194, 138, 56, 0.18)",
              borderRadius: "18px",
              background:
                "rgba(255, 255, 255, 0.025)",
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
              lineHeight: 1.7,
              color:
                "rgba(241, 216, 177, 0.78)",
            }}
          >
            <div>
              Evento:{" "}
              <strong>
                {selectedEvent ?? "—"}
              </strong>
            </div>

            <div>
              Adultos:{" "}
              <strong>{adults}</strong>
            </div>

            <div>
              Crianças:{" "}
              <strong>{children}</strong>
            </div>

            <div>
              Equivalente:{" "}
              <strong>
                {equivalentGuests}
              </strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}