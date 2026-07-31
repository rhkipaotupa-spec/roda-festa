import "./EventScene.css";

import SceneBackground from "./SceneBackground";
import SceneFloor from "./SceneFloor";
import Cart from "./Cart";
import DessertTable from "./DessertTable";

export default function EventScene() {
  return (
    <section className="event-scene">
      <SceneBackground />
      <SceneFloor />

      <div className="event-scene__content">
        <Cart />

        <DessertTable
          config={{
            visible: true,
            decoration: true,
            cake: true,
            brigadeiro: true,
          }}
        />
      </div>

      <div className="event-scene__label">Planner visual</div>

      <div className="event-scene__summary">
        <strong>Resumo do evento</strong>
        <span>Configure os serviços para montar sua experiência.</span>
      </div>
    </section>
  );
}