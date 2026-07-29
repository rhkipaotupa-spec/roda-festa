import "./SceneTwo.css";

const careItems = [
  {
    title: "Preparo na hora",
    description:
      "Levamos nossa estrutura até o evento e preparamos os alimentos na hora, garantindo sabor, qualidade e uma experiência especial para seus convidados.",
  },
  {
    title: "Serviço no evento",
    description:
      "Quando contratado, nossa equipe realiza o atendimento aos convidados com organização, agilidade e cordialidade durante todo o evento.",
  },
  {
    title: "Cuidado em cada detalhe",
    description:
      "Cada preparo e cada atendimento acontecem com atenção para que você aproveite a festa enquanto cuidamos da gastronomia.",
  },
];

function WheelIcon() {
  return (
    <span className="scene-two-wheel" aria-hidden="true">
      <span className="scene-two-wheel-center" />
      <span className="scene-two-wheel-spoke scene-two-wheel-spoke-1" />
      <span className="scene-two-wheel-spoke scene-two-wheel-spoke-2" />
      <span className="scene-two-wheel-spoke scene-two-wheel-spoke-3" />
      <span className="scene-two-wheel-spoke scene-two-wheel-spoke-4" />
    </span>
  );
}

function SceneTwo() {
  return (
    <section
      id="como-funciona"
      className="scene-two"
      aria-labelledby="scene-two-title"
    >
      <div className="container scene-two-content">
        <div className="scene-two-introduction">
          <p className="scene-two-eyebrow">Nós cuidamos de cada detalhe</p>

          <h2 id="scene-two-title" className="scene-two-title">
            <span>Você aproveita a festa.</span>
            <strong>Nós cuidamos da experiência.</strong>
          </h2>

          <p className="scene-two-description">
            Da preparação ao atendimento, cuidamos da gastronomia do seu evento
            para que tudo seja servido com sabor, organização e confiança.
          </p>
        </div>

        <div className="scene-two-grid">
          {careItems.map((item) => (
            <article className="scene-two-card" key={item.title}>
              <WheelIcon />

              <div className="scene-two-card-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SceneTwo;