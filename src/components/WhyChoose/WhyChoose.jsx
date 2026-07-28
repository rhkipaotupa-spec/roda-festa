import "./WhyChoose.css";
import structureCart from "../../assets/images/structure-cart.png";

function WhyChoose() {
  const benefits = [
    {
      title: "Produtos preparados na hora",
      description:
        "Mais sabor, frescor e qualidade para servir seus convidados com excelência.",
    },
    {
      title: "Atendimento acolhedor",
      description:
        "Uma equipe preparada para atender com simpatia, atenção e cuidado.",
    },
    {
      title: "Estrutura elegante",
      description:
        "Carrinhos e estações que valorizam a decoração e a experiência do evento.",
    },
    {
      title: "Montagem completa",
      description:
        "Cuidamos da organização para que você possa aproveitar cada momento.",
    },
  ];

  return (
    <section className="why-choose" id="por-que-escolher">
      <div className="why-choose__container">
        <header className="why-choose__header">
          <span className="why-choose__eyebrow">
            POR QUE ESCOLHER A RODA FESTA
          </span>

          <h2 className="why-choose__title">
            Você aproveita a festa.
            <span>Nós cuidamos de todo o resto.</span>
          </h2>

          <p className="why-choose__description">
            Enquanto você aproveita cada momento com seus convidados, nossa
            equipe cuida da montagem, do atendimento e de todos os detalhes para
            que sua única preocupação seja celebrar.
          </p>

          <a className="why-choose__button" href="#contato">
            Solicitar um orçamento
          </a>
        </header>

        <div className="why-choose__image-wrapper">
          <img
            className="why-choose__image"
            src={structureCart}
            alt="Estrutura da Roda Festa preparada para um evento"
          />

          <div className="why-choose__image-caption">
            <span>Estrutura completa</span>
            <strong>Experiência em cada detalhe</strong>
          </div>
        </div>

        <div className="why-choose__benefits">
          {benefits.map((benefit, index) => (
            <article className="why-choose__benefit" key={benefit.title}>
              <div className="why-choose__benefit-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyChoose;