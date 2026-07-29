import { useEffect, useRef, useState } from "react";
import "./SceneThree.css";

import memoryFamily from "../../assets/images/memory-family.jpg";
import memoryFood from "../../assets/images/memory-food.jpg";
import memoryParty from "../../assets/images/memory-party.jpg";

const memories = [
  {
    id: 1,
    image: memoryFamily,
    alt: "Família aproveitando uma festa infantil",
    quote: "Consegui brincar e participar da festa inteira.",
    context: "Aniversário infantil",
    position: "memory-card--first",
  },
  {
    id: 2,
    image: memoryFood,
    alt: "Alimentos sendo preparados durante um evento",
    quote: "A comida preparada na hora encantou todos os convidados.",
    context: "Celebração em família",
    position: "memory-card--second",
  },
  {
    id: 3,
    image: memoryParty,
    alt: "Família aproveitando os momentos de uma celebração",
    quote:
      "Quando percebi, a festa estava terminando e eu tinha aproveitado cada minuto.",
    context: "Um dia para guardar",
    position: "memory-card--third",
  },
];

function MemorySeal() {
  return (
    <span className="memory-seal" aria-hidden="true">
      <span className="memory-seal-center" />

      <span className="memory-seal-spoke memory-seal-spoke--one" />
      <span className="memory-seal-spoke memory-seal-spoke--two" />
      <span className="memory-seal-spoke memory-seal-spoke--three" />
      <span className="memory-seal-spoke memory-seal-spoke--four" />
    </span>
  );
}

function SceneThree() {
  const sceneRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const sceneElement = sceneRef.current;

    if (!sceneElement) {
      return undefined;
    }

    if (!("IntersectionObserver" in window)) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(sceneElement);
        }
      },
      {
        threshold: 0.16,
      },
    );

    observer.observe(sceneElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="memorias"
      ref={sceneRef}
      className={`scene-three ${isVisible ? "scene-three--visible" : ""}`}
      aria-labelledby="scene-three-title"
    >
      <div className="container scene-three-container">
        <header className="scene-three-header">
          <p className="scene-three-eyebrow">Memórias</p>

          <h2 id="scene-three-title" className="scene-three-title">
            Memórias que ajudamos a criar.
          </h2>

          <p className="scene-three-description">
            Porque a melhor lembrança de uma festa é poder vivê-la por inteiro.
          </p>

          <div className="scene-three-divider" aria-hidden="true">
            <span className="scene-three-divider-line" />

            <MemorySeal />

            <span className="scene-three-divider-line" />
          </div>
        </header>

        <div
          className="scene-three-album"
          aria-label="Álbum de memórias da Roda Festa"
        >
          {memories.map((memory, index) => (
            <article
              className={`memory-card ${memory.position}`}
              style={{
                "--memory-delay": `${index * 140}ms`,
              }}
              key={memory.id}
            >
              <div className="memory-card-image-wrapper">
                <img
                  className="memory-card-image"
                  src={memory.image}
                  alt={memory.alt}
                  loading="lazy"
                />
              </div>

              <div className="memory-card-content">
                <blockquote className="memory-card-quote">
                  “{memory.quote}”
                </blockquote>

                <div className="memory-card-separator" aria-hidden="true" />

                <div className="memory-card-footer">
                  <p className="memory-card-context">{memory.context}</p>

                  <MemorySeal />
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="scene-three-mobile-hint">
          Deslize para conhecer outras memórias.
        </p>
      </div>
    </section>
  );
}

export default SceneThree;