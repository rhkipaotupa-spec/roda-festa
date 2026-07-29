import { useEffect, useRef, useState } from "react";
import "./SceneFour.css";

import flavorMain from "../../assets/images/flavor-main.jpg";
import flavorBurger from "../../assets/images/flavor-burger.jpg";
import flavorSnacks from "../../assets/images/flavor-snacks.jpg";

const flavors = [
  {
    id: 1,
    image: flavorMain,
    alt: "Alimentos sendo preparados durante um evento",
    eyebrow: "Experiência ao vivo",
    title: "Preparado diante dos seus convidados.",
    description:
      "O aroma, o cuidado e o sabor fazem parte do momento enquanto cada preparo acontece no próprio evento.",
    className: "flavor-feature--main",
  },
  {
    id: 2,
    image: flavorBurger,
    alt: "Mini X-Búrguer preparado para uma celebração",
    eyebrow: "Mini X-Búrguer",
    title: "Pequeno no tamanho. Memorável no sabor.",
    description:
      "Uma escolha que conquista crianças e adultos e transforma cada pausa em mais um momento especial.",
    className: "flavor-feature--burger",
  },
  {
    id: 3,
    image: flavorSnacks,
    alt: "Pastéis e salgados servidos durante um evento",
    eyebrow: "Pastéis e salgados",
    title: "Servidos quentes, no tempo certo.",
    description:
      "Preparos frescos e cuidadosos para que cada convidado aproveite a experiência com sabor e qualidade.",
    className: "flavor-feature--snacks",
  },
];

function FlavorWheel() {
  return (
    <span className="flavor-wheel" aria-hidden="true">
      <span className="flavor-wheel-center" />

      <span className="flavor-wheel-spoke flavor-wheel-spoke--one" />
      <span className="flavor-wheel-spoke flavor-wheel-spoke--two" />
      <span className="flavor-wheel-spoke flavor-wheel-spoke--three" />
      <span className="flavor-wheel-spoke flavor-wheel-spoke--four" />
    </span>
  );
}

function FlavorFeature({ flavor, index }) {
  return (
    <article
      className={`flavor-feature ${flavor.className}`}
      style={{
        "--flavor-delay": `${index * 140}ms`,
      }}
    >
      <div className="flavor-feature-image-wrapper">
        <img
          className="flavor-feature-image"
          src={flavor.image}
          alt={flavor.alt}
          loading="lazy"
        />

        <span className="flavor-feature-light" aria-hidden="true" />
      </div>

      <div className="flavor-feature-content">
        <div className="flavor-feature-heading">
          <p className="flavor-feature-eyebrow">{flavor.eyebrow}</p>

          <FlavorWheel />
        </div>

        <h3 className="flavor-feature-title">{flavor.title}</h3>

        <p className="flavor-feature-description">{flavor.description}</p>

        <span className="flavor-feature-line" aria-hidden="true" />
      </div>
    </article>
  );
}

function SceneFour() {
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
        threshold: 0.12,
      },
    );

    observer.observe(sceneElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="sabores"
      ref={sceneRef}
      className={`scene-four ${isVisible ? "scene-four--visible" : ""}`}
      aria-labelledby="scene-four-title"
    >
      <div className="container scene-four-container">
        <header className="scene-four-header">
          <p className="scene-four-eyebrow">Sabores</p>

          <h2 id="scene-four-title" className="scene-four-title">
            Toda memória também tem um sabor.
          </h2>

          <p className="scene-four-description">
            Do preparo ao primeiro pedaço, cada escolha faz parte da
            experiência.
          </p>

          <div className="scene-four-divider" aria-hidden="true">
            <span className="scene-four-divider-line" />

            <FlavorWheel />

            <span className="scene-four-divider-line" />
          </div>
        </header>

        <div className="scene-four-editorial">
          {flavors.map((flavor, index) => (
            <FlavorFeature flavor={flavor} index={index} key={flavor.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default SceneFour;