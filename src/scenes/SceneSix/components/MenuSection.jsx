function BrandWheel({ className = "" }) {
  return (
    <span
      className={`scene-six__brand-wheel ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="scene-six__brand-wheel-ring">
        <span className="scene-six__brand-wheel-center" />

        <span className="scene-six__brand-wheel-spoke scene-six__brand-wheel-spoke--1" />
        <span className="scene-six__brand-wheel-spoke scene-six__brand-wheel-spoke--2" />
        <span className="scene-six__brand-wheel-spoke scene-six__brand-wheel-spoke--3" />
        <span className="scene-six__brand-wheel-spoke scene-six__brand-wheel-spoke--4" />
      </span>
    </span>
  );
}

function MenuSection({ section, index }) {
  const isImageRight = section.layout === "image-right";

  const sectionClassName = [
    "scene-six__chapter",
    isImageRight ? "scene-six__chapter--image-right" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={sectionClassName}
      id={section.id}
      data-menu-section
      style={{
        "--scene-six-chapter-index": index,
      }}
    >
      <div className="scene-six__chapter-inner">
        <div className="scene-six__visual">
          <figure className="scene-six__photo-frame">
            <img
              className="scene-six__photo"
              src={section.image}
              alt={section.imageAlt}
              loading={index < 2 ? "eager" : "lazy"}
            />

            <div
              className="scene-six__photo-overlay"
              aria-hidden="true"
            />

            <figcaption className="scene-six__photo-caption">
              <span>{section.chapter}</span>
              <span>Roda Festa</span>
            </figcaption>

            <BrandWheel className="scene-six__brand-wheel--photo" />
          </figure>
        </div>

        <div className="scene-six__chapter-content">
          <div className="scene-six__chapter-heading">
            <span className="scene-six__chapter-number">
              {String(index + 1).padStart(2, "0")}
            </span>

            <span className="scene-six__chapter-label">
              {section.chapter}
            </span>
          </div>

          <p
            className="scene-six__background-category"
            aria-hidden="true"
          >
            {section.category}
          </p>

          <h3 className="scene-six__category">
            {section.category}
          </h3>

          <h4 className="scene-six__chapter-title">
            {section.title}
          </h4>

          <p className="scene-six__chapter-description">
            {section.description}
          </p>

          <div
            className="scene-six__chapter-divider"
            aria-hidden="true"
          >
            <span />
            <i />
          </div>

          <ul
            className="scene-six__items"
            aria-label={`Opções de ${section.category}`}
          >
            {section.items.map((item, itemIndex) => (
              <li
                className="scene-six__item"
                key={item}
                style={{
                  "--scene-six-item-index": itemIndex,
                }}
              >
                <span className="scene-six__item-name">
                  {item}
                </span>

                <span
                  className="scene-six__item-dots"
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>

          <p className="scene-six__extra">
            {section.extraText}
          </p>
        </div>
      </div>
    </article>
  );
}

export default MenuSection;