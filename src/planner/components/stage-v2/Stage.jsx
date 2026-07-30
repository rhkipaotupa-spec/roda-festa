import "./Stage.css";

import Background from "./Background";
import Floor from "./Floor";
import Cart from "./Cart";
import DessertTable from "./DessertTable";

import { initialStageState } from "./stageState";

export default function Stage() {
  const stageState = initialStageState;

  return (
    <section className="stage-v2">
      <Background />
      <Floor />

      <div className="stage-v2__scene">
        <Cart operations={stageState.operations} />

        <DessertTable config={stageState.dessertTable} />
      </div>

      <div className="stage-v2__label">
        Planner visual
      </div>

      <div className="stage-v2__summary">
        <strong>Resumo do evento</strong>
        <span>Mini X-Burguer e mesa de doces</span>
      </div>
    </section>
  );
}