import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import EventSelector from "./controls/EventSelector";
import PlannerProfileSelector from "./controls/PlannerProfileSelector";
import ProgressFooter from "./layout/ProgressFooter";
import EventScene from "./scene/EventScene";
import StepWelcome from "./steps/StepWelcome";

import PlannerEngine from "./engine/PlannerEngine";

import {
  initialPlannerState,
} from "./state/initialPlannerState";

import "./Planner-old.css";
import "./Planner.css";

const WELCOME_TRANSITION_DURATION = 3500;

export default function Planner() {
  const [
    hasStarted,
    setHasStarted,
  ] = useState(false);

  const [
    isTransitioning,
    setIsTransitioning,
  ] = useState(false);

  const transitionTimeoutRef =
    useRef(null);

  const [
    plannerState,
    setPlannerState,
  ] = useState(initialPlannerState);

  const plannerResult = useMemo(() => {
    return PlannerEngine.build(
      plannerState
    );
  }, [plannerState]);

  useEffect(() => {
    return () => {
      if (
        transitionTimeoutRef.current
      ) {
        window.clearTimeout(
          transitionTimeoutRef.current
        );
      }
    };
  }, []);

  function handleStartPlanning() {
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(true);

    transitionTimeoutRef.current =
      window.setTimeout(() => {
        setHasStarted(true);
        setIsTransitioning(false);
      }, WELCOME_TRANSITION_DURATION);
  }

  function handleSelectEvent(eventType) {
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

  function handleSelectProfile(
    profileId
  ) {
    setPlannerState(
      (currentPlannerState) => ({
        ...currentPlannerState,

        preferences: {
          ...currentPlannerState.preferences,
          profile: profileId,
        },
      })
    );
  }

  if (!hasStarted) {
    return (
      <StepWelcome
        isTransitioning={
          isTransitioning
        }
        onStart={
          handleStartPlanning
        }
      />
    );
  }

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

          {plannerState.event.type && (
            <PlannerProfileSelector
              selectedProfile={
                plannerState
                  .preferences
                  .profile
              }
              onSelectProfile={
                handleSelectProfile
              }
            />
          )}
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