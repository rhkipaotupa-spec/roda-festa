import "./Stage.css";

import Background from "./Background";
import Floor from "./Floor";
import Cart from "./Cart";
import SweetsTable from "./SweetsTable";

import { initialStageState } from "./stageState";

export default function Stage() {
  const stageState = initialStageState;

  return (
    <section className="stage">
      <Background />

      <Floor />

      <Cart state={stageState} />

      <SweetsTable state={stageState} />

      <div className="stage__label">
        PLANNER VISUAL
      </div>

      <div className="stage__summary">
        <div>
          <strong>Resumo do evento</strong>
          <span>Primeira composição em teste</span>
        </div>
      </div>
    </section>
  );
}