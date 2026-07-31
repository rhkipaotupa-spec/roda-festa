import {
  useMemo,
  useState,
} from "react";

import EventSelector from "./controls/EventSelector";
import ProgressFooter from "./layout/ProgressFooter";
import EventScene from "./scene/EventScene";

import PlannerEngine from "./engine/PlannerEngine";

import {
  initialPlannerState,
} from "./state/initialPlannerState";

import "./Planner-old.css";
import "./Planner.css";

export default function Planner() {
  const [
    plannerState,
    setPlannerState,
  ] = useState(initialPlannerState);

  const plannerResult = useMemo(() => {
    return PlannerEngine.build(plannerState);
  }, [plannerState]);

function handleSelectEvent(eventType) {

  console.log("CLICOU:", eventType);

  setPlannerState(
    (currentPlannerState) => ({
      ...currentPlannerState,

      event: {
        ...currentPlannerState.event,
        type: eventType,
      },
    })
  );
}

  console.log(
    "PLANNER STATE:",
    plannerState
  );

  console.log(
    "PLANNER RESULT:",
    plannerResult
  );

  console.log(
  "TIPO DO EVENTO:",
  plannerState.event.type
);

console.log(
  "REGRA ENCONTRADA:",
  plannerResult.recommendation.ruleId
);

console.log(
  "OBJETOS DA CENA:",
  plannerResult.scene.objects
);

  return (
    <main className="planner">
      <div className="planner__content">
        <section className="planner__controls">
          <EventSelector
            selectedEvent={
              plannerState.event.type
            }
            onSelectEvent={
              handleSelectEvent
            }
          />
        </section>

        <section className="planner__preview">
          <EventScene
            plannerResult={
              plannerResult
            }
          />
        </section>
      </div>

      <ProgressFooter />
    </main>
  );
}