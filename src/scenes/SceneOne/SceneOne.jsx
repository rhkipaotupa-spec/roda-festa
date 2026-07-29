import "./SceneOne.css";
import heroImage from "../../assets/images/hero-cart.png";

function SceneOne() {
  return (
    <section className="scene-one" aria-labelledby="scene-one-title">
      <div
        className="scene-one-background"
        style={{ backgroundImage: `url(${heroImage})` }}
        aria-hidden="true"
      />

      <div className="scene-one-overlay" aria-hidden="true" />

      <div className="scene-one-content">
        <div className="container">
          <div className="scene-one-copy">
            <p className="scene-one-eyebrow">GASTRONOMIA QUE ENCANTA</p>

            <h1 id="scene-one-title" className="scene-one-title">
              <span>Enquanto você cria memórias...</span>

              <strong>
                nós cuidamos de
                <br />
                todo o restante.
              </strong>
            </h1>

            <p className="scene-one-description">
              Gastronomia preparada na hora, atendimento acolhedor e uma
              experiência pensada para que você aproveite cada momento da sua
              festa.
            </p>

            <div className="scene-one-actions">
              <a
                className="scene-one-primary-button"
                href="https://wa.me/5514998960208"
                target="_blank"
                rel="noreferrer"
              >
                Planejar meu evento
              </a>

              <a className="scene-one-secondary-link" href="#como-funciona">
                Conhecer a experiência
                <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SceneOne;