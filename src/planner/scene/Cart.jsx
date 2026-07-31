import cartImage from "../components/stage/cart.png";

const cartVariants = {
  "mini-snack-cart": {
    title: "Mini Lanches",
    subtitle: "Preparados na hora",
    icon: "🍔",
    className: "event-scene-cart--mini-snacks",
  },

  "fried-snack-cart": {
    title: "Petiscos",
    subtitle: "Fritos durante o evento",
    icon: "🥟",
    className: "event-scene-cart--fried-snacks",
  },

  "drinks-station": {
    title: "Bebidas",
    subtitle: "Reposição contínua",
    icon: "🥤",
    className: "event-scene-cart--drinks",
  },
};

const defaultVariant = {
  title: "Roda Festa",
  subtitle: "Serviço para eventos",
  icon: "✨",
  className: "event-scene-cart--default",
};

export default function Cart({
  children,
  serviceId,
  sceneObject,
}) {
  const variant =
    cartVariants[serviceId] ??
    defaultVariant;

  return (
    <div
      className={[
        "event-scene-cart",
        variant.className,
      ].join(" ")}
      data-service-id={serviceId}
    >
      <img
        src={cartImage}
        alt={
          sceneObject?.serviceName ??
          variant.title
        }
        className="event-scene-cart__image"
      />

      <div className="event-scene-cart__identity">
        <span
          className="event-scene-cart__identity-icon"
          aria-hidden="true"
        >
          {variant.icon}
        </span>

        <div>
          <strong>{variant.title}</strong>
          <span>{variant.subtitle}</span>
        </div>
      </div>

      {children && (
        <div className="event-scene-cart__content">
          {children}
        </div>
      )}
    </div>
  );
}