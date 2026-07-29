import { useEffect, useRef } from "react";
import MenuSection from "./components/MenuSection";
import menuData, { heroCardapio } from "./data/menuData";
import "./SceneSix.css";

function HeroWheel() {
  return (
    <span
      className="scene-six__hero-wheel"
      aria-hidden="true"
    >
      <span className="scene-six__hero-wheel-ring">
        <span className="scene-six__hero-wheel-center" />

        <span className="scene-six__hero-wheel-spoke scene-six__hero-wheel-spoke--1" />
        <span className="scene-six__hero-wheel-spoke scene-six__hero-wheel-spoke--2" />
        <span className="scene-six__hero-wheel-spoke scene-six__hero-wheel-spoke--3" />
        <span className="scene-six__hero-wheel-spoke scene-six__hero-wheel-spoke--4" />
      </span>
    </span>
  );
}

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
      className="scene-six"
      id="cardapio"
      ref={sceneRef}
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
            Do preparo ao primeiro pedaço, cada escolha faz
            parte da experiência e ajuda a transformar
            encontros em boas lembranças.
          </p>

          <a
            className="scene-six__hero-scroll"
            href="#petiscos"
            aria-label="Explorar o cardápio"
          >
            <span>Descubra nossos sabores</span>
            <i aria-hidden="true">↓</i>
          </a>
        </div>

        <HeroWheel />
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
          Escolhas que contam histórias
        </span>

        <h3 className="scene-six__closing-title">
          Agora imagine tudo isso
          <em> fazendo parte da sua celebração.</em>
        </h3>

        <p className="scene-six__closing-description">
          Cada evento pode receber uma combinação diferente,
          criada de acordo com o momento, os convidados e a
          experiência que você deseja proporcionar.
        </p>

        <a
          className="scene-six__closing-button"
          href="#orcamento"
        >
          <span>Solicitar meu orçamento</span>
          <span aria-hidden="true">→</span>
        </a>
      </footer>
    </section>
  );
}

export default SceneSix;