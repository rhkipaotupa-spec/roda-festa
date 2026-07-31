import EventSelector from "./controls/EventSelector";
import ProgressFooter from "./layout/ProgressFooter";
import EventScene from "./scene/EventScene";

import "./Planner.css";

export default function Planner() {
  return (
    <main className="planner">
      <div className="planner__content">
        <section className="planner__controls">
          <EventSelector />
        </section>

        <section className="planner__preview">
          <EventScene />
        </section>
      </div>

      <ProgressFooter />
    </main>
  );
}