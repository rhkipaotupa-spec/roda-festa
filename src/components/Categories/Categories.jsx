import "./Categories.css";

const categories = [
  {
    id: 1,
    title: "Frituras",
  },
  {
    id: 2,
    title: "Mini Lanches",
  },
  {
    id: 3,
    title: "Bolos",
  },
  {
    id: 4,
    title: "Docinhos",
  },
  {
    id: 5,
    title: "Bebidas",
  },
];

function Categories() {
  return (
    <section className="categories" id="cardapio">
      <div className="container">
        <div className="categories-heading">
          <span>Nossos cardápios</span>

          <h2>Opções para todos os momentos.</h2>

          <p>
            Escolha as categorias que mais combinam com o estilo do seu evento.
          </p>
        </div>

        <div className="categories-grid">
          {categories.map((category) => (
            <article className="category-card" key={category.id}>
              <div className="category-card-image">
                <span>Imagem da categoria</span>
              </div>

              <div className="category-card-content">
                <h3>{category.title}</h3>
                <span aria-hidden="true">→</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Categories;