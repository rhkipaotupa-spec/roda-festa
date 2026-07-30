import plannerStage from "../assets/backgrounds/planner-stage.png";

function PlanningPanel() {
  return (
    <section className="planning-panel">
      <div
        className="planning-panel__stage"
        style={{
          backgroundImage: `url(${plannerStage})`,
        }}
      >
        <div className="planning-panel__shade" />

        <div className="planning-panel__frame" />

        <div className="planning-panel__content">
          <span className="planning-panel__eyebrow">
            Seu planejamento
          </span>

          <h2 className="planning-panel__title">
            Seu evento
            <br />
            começa aqui.
          </h2>

          <p className="planning-panel__description">
            Cada escolha aparecerá neste painel enquanto sua celebração ganha
            forma.
          </p>
        </div>
      </div>
    </section>
  );
}

export default PlanningPanel;