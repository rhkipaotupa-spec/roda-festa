import { useEffect, useRef, useState } from "react";
import "./SceneFive.css";

import storyBirthday from "../../assets/images/story-birthday.jpg";
import storyWedding from "../../assets/images/story-wedding.jpg";
import storyCorporate from "../../assets/images/story-corporate.jpg";

const stories = [
  {
    id: 1,
    number: "01",
    image: storyBirthday,
    alt: "Família aproveitando uma festa de aniversário infantil",
    eyebrow: "Aniversários",
    title: "Uma infância cheia de momentos para guardar.",
    description:
      "Enquanto as crianças brincam e descobrem cada detalhe da festa, os adultos podem estar verdadeiramente presentes.",
    action: "Conhecer essa experiência",
    href: "#contato",
    className: "story-panel--birthday",
  },
  {
    id: 2,
    number: "02",
    image: storyWedding,
    alt: "Casal e convidados celebrando um casamento",
    eyebrow: "Casamentos",
    title: "Sabores à altura de um dia inesquecível.",
    description:
      "Uma experiência gastronômica acolhedora, elegante e preparada para acompanhar um dos momentos mais importantes da sua história.",
    action: "Conhecer essa experiência",
    href: "#contato",
    className: "story-panel--wedding",
  },
  {
    id: 3,
    number: "03",
    image: storyCorporate,
    alt: "Convidados participando de um evento corporativo",
    eyebrow: "Eventos corporativos",
    title: "Uma experiência que também fala pela sua marca.",
    description:
      "Receba clientes, parceiros e colaboradores com cuidado, organização e uma gastronomia que valoriza cada encontro.",
    action: "Conhecer essa experiência",
    href: "#contato",
    className: "story-panel--corporate",
  },
];

function StoryWheel() {
  return (
    <span className="story-wheel" aria-hidden="true">
      <span className="story-wheel-center" />

      <span className="story-wheel-spoke story-wheel-spoke--one" />
      <span className="story-wheel-spoke story-wheel-spoke--two" />
      <span className="story-wheel-spoke story-wheel-spoke--three" />
      <span className="story-wheel-spoke story-wheel-spoke--four" />
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="story-panel-arrow"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h13" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function SceneFive() {
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
        threshold: 0.1,
      },
    );

    observer.observe(sceneElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="historias"
      ref={sceneRef}
      className={`scene-five ${isVisible ? "scene-five--visible" : ""}`}
      aria-labelledby="scene-five-title"
    >
      <div className="container scene-five-container">
        <header className="scene-five-header">
          <p className="scene-five-eyebrow">Histórias</p>

          <h2 id="scene-five-title" className="scene-five-title">
            Histórias que temos o privilégio de fazer parte.
          </h2>

          <p className="scene-five-description">
            Cada celebração tem seu próprio significado. Nosso papel é cuidar da
            experiência para que você possa viver tudo o que realmente importa.
          </p>

          <div className="scene-five-divider" aria-hidden="true">
            <span className="scene-five-divider-line" />

            <StoryWheel />

            <span className="scene-five-divider-line" />
          </div>
        </header>

        <div className="scene-five-stories">
          {stories.map((story, index) => (
            <article
              className={`story-panel ${story.className}`}
              style={{
                "--story-delay": `${index * 150}ms`,
              }}
              key={story.id}
            >
              <img
                className="story-panel-image"
                src={story.image}
                alt={story.alt}
                loading="lazy"
              />

              <span className="story-panel-overlay" aria-hidden="true" />

              <span className="story-panel-light" aria-hidden="true" />

              <div className="story-panel-top">
                <span className="story-panel-number">{story.number}</span>

                <StoryWheel />
              </div>

              <div className="story-panel-content">
                <p className="story-panel-eyebrow">{story.eyebrow}</p>

                <h3 className="story-panel-title">{story.title}</h3>

                <div className="story-panel-reveal">
                  <p className="story-panel-description">
                    {story.description}
                  </p>

                  <a className="story-panel-link" href={story.href}>
                    <span>{story.action}</span>
                    <ArrowIcon />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="scene-five-closing">
          <p className="scene-five-closing-text">
            Seja qual for o seu momento, ele merece ser vivido por inteiro.
          </p>

          <a className="scene-five-closing-link" href="#contato">
            <span>Conte-nos sobre a sua celebração</span>
            <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}

export default SceneFive;