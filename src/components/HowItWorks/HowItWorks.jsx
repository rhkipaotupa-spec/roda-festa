import "./HowItWorks.css";

const steps = [
  {
    number: "01",
    title: "Escolha seu cardápio",
    description:
      "Selecione as opções que mais combinam com o estilo do seu evento.",
  },
  {
    number: "02",
    title: "Informe os detalhes",
    description:
      "Conte quantos convidados terá, a duração e as informações da festa.",
  },
  {
    number: "03",
    title: "Receba sua proposta",
    description:
      "O sistema organiza as escolhas e prepara uma estimativa personalizada.",
  },
  {
    number: "04",
    title: "Aproveite o momento",
    description:
      "Nossa equipe cuida da estrutura para você aproveitar seus convidados.",
  },
];

function HowItWorks() {
  return (
    <section className="how-it-works" id="como-funciona">
      <div className="container">
        <div className="how-it-works-heading">
          <span>Como funciona</span>
          <h2>Simples, prático e delicioso.</h2>
          <p>
            Em poucos passos, você monta a experiência ideal para o seu evento.
          </p>
        </div>

        <div className="how-it-works-grid">
          {steps.map((step) => (
            <article className="how-it-works-card" key={step.number}>
              <span className="how-it-works-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;