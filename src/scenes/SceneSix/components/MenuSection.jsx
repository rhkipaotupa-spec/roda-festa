function StoryWheel() {
  return (
    <span
      className="scene-six__story-wheel"
      aria-hidden="true"
    >
      <span className="scene-six__story-wheel-center" />

      {Array.from({ length: 8 }).map((_, index) => (
        <span
          key={index}
          className="scene-six__story-wheel-spoke"
          style={{
            transform: `translate(-50%, 0) rotate(${index * 45}deg)`,
          }}
        />
      ))}
    </span>
  );
}

function MenuSection({ section, index }) {
  const imageRight = section.layout === "image-right";

  return (
    <article
      id={section.id}
      data-menu-section
      className={`scene-six__chapter ${
        imageRight ? "scene-six__chapter--image-right" : ""
      }`}
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
              <span className="scene-six__photo-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <span
                className="scene-six__photo-line"
                aria-hidden="true"
              />

              <span className="scene-six__photo-category">
                {section.category}
              </span>
            </figcaption>

            <div className="scene-six__photo-wheel">
              <StoryWheel />
            </div>
          </figure>
        </div>

        <div className="scene-six__chapter-content">
          <div className="scene-six__chapter-heading">
            <span className="scene-six__chapter-number">
              {String(index + 1).padStart(2, "0")}
            </span>

            <span className="scene-six__chapter-heading-line" />

            <span className="scene-six__chapter-label">
              {section.category}
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

          <ul className="scene-six__items">
            {section.items.map((item, itemIndex) => (
              <li
                key={`${item.title}-${item.subtitle}-${itemIndex}`}
                className="scene-six__item"
              >
                <span className="scene-six__item-copy">
                  <span className="scene-six__item-name">
                    {item.title}
                  </span>

                  <span className="scene-six__item-description">
                    {item.subtitle}
                  </span>
                </span>

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