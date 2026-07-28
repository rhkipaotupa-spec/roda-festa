import "./Structure.css";
import structureCart from "../../assets/images/structure-cart.png";

const features = [
  {
    id: 1,
    title: "Carrinhos Profissionais",
    description:
      "Estrutura elegante e preparada para eventos de todos os portes.",
  },
  {
    id: 2,
    title: "Equipe Treinada",
    description:
      "Atendimento cordial, organizado e focado na experiência dos convidados.",
  },
  {
    id: 3,
    title: "Montagem Completa",
    description:
      "Levamos, montamos e desmontamos toda a estrutura para você.",
  },
  {
    id: 4,
    title: "Produtos na Hora",
    description:
      "Tudo preparado no momento do evento para garantir sabor e qualidade.",
  },
];

function Structure() {
  return (
    <section className="structure" id="estrutura">
      <div className="container">
        <div className="structure-content">
          <div className="structure-image">
            <img
              src={structureCart}
              alt="Carrinho da Roda Festa montado para um evento"
              className="structure-photo"
            />
          </div>

          <div className="structure-info">
            <span className="section-tag">Nossa estrutura</span>

            <h2>Levamos muito mais do que um carrinho.</h2>

            <p className="structure-text">
              Cuidamos de toda a operação para que você aproveite seu evento sem
              preocupações. Nossa equipe chega preparada, organiza toda a
              estrutura e atende seus convidados com qualidade do início ao fim.
            </p>

            <div className="structure-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.id}>
                  <div className="feature-icon" aria-hidden="true">
                    ✓
                  </div>

                  <h3>{feature.title}</h3>

                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Structure;