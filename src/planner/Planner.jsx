import EventSelector from "./components/EventSelector";
import ProgressFooter from "./components/ProgressFooter";
import Stage from "./components/stage-v2/Stage";

import "./Planner.css";

export default function Planner() {
  return (
    <main className="planner">
      <div className="planner__content">
        <section className="planner__controls">
          <EventSelector />
        </section>

        <section className="planner__preview">
          <Stage />
        </section>
      </div>

      <ProgressFooter />
    </main>
  );
}