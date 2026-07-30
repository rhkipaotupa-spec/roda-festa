import { useEffect, useRef } from "react";

import MenuSection from "./components/MenuSection";
import menuData, { heroCardapio } from "./data/menuData";

import "./SceneSix.css";

function SceneSix() {
  const sceneRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;

    if (!scene) {
      return undefined;
    }

    const revealElements = scene.querySelectorAll(
      "[data-scene-six-reveal], [data-menu-section]"
    );

    if (!("IntersectionObserver" in window)) {
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });

      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sceneRef}
      className="scene-six"
      id="cardapio"
      aria-labelledby="scene-six-title"
    >
      <header className="scene-six__hero">
        <img
          className="scene-six__hero-image"
          src={heroCardapio.image}
          alt={heroCardapio.imageAlt}
        />

        <div
          className="scene-six__hero-shade"
          aria-hidden="true"
        />

        <div
          className="scene-six__hero-content"
          data-scene-six-reveal
        >
          <span className="scene-six__hero-eyebrow">
            Nosso cardápio
          </span>

          <h2
            className="scene-six__hero-title"
            id="scene-six-title"
          >
            Toda memória
            <em> também tem um sabor.</em>
          </h2>

          <p className="scene-six__hero-description">
            Do preparo ao primeiro pedaço, cada escolha faz parte
            da experiência e ajuda a transformar encontros em boas
            lembranças.
          </p>

          <a
            className="scene-six__hero-scroll"
            href="#petiscos"
            aria-label="Explorar o cardápio"
          >
            <span>Descubra nossos sabores</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </header>

      <div className="scene-six__chapters">
        {menuData.map((section, index) => (
          <MenuSection
            key={section.id}
            section={section}
            index={index}
          />
        ))}
      </div>

      <footer
        className="scene-six__closing"
        data-scene-six-reveal
      >
        <span
          className="scene-six__closing-symbol"
          aria-hidden="true"
        >
          ✦
        </span>

        <span className="scene-six__closing-eyebrow">
          Sua celebração começa aqui
        </span>

        <h3 className="scene-six__closing-title">
          Agora transforme esses sabores
          <em> na experiência ideal para o seu evento.</em>
        </h3>

        <p className="scene-six__closing-description">
          Escolha o tipo de celebração, conte-nos quem estará
          presente e descubra uma composição criada especialmente
          para o seu momento.
        </p>

        <a
          className="scene-six__closing-button"
          href="#simulador"
        >
          <span>Montar minha celebração</span>
          <span aria-hidden="true">→</span>
        </a>
      </footer>
    </section>
  );
}

export default SceneSix;