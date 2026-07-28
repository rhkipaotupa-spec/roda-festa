import "./Hero.css";
import heroCart from "../../assets/images/hero-cart.png";

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-content">
        <div className="hero-text">
          <span className="hero-eyebrow">Gastronomia que encanta</span>

          <h1>
            Monte sua festa com elegância e praticidade.
          </h1>

          <p>
            Transformamos seu evento em uma experiência memorável,
            com estrutura completa, atendimento cuidadoso e sabores
            que encantam.
          </p>

          <a href="#orcamento" className="hero-button">
            Monte sua Festa
          </a>
        </div>
<div className="hero-image">
  <img
    src={heroCart}
    alt="Carrinho gastronômico da Roda Festa"
  />
</div>
      </div>
    </section>
  );
}

export default Hero;