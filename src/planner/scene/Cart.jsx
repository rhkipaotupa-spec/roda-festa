import cartImage from "../components/stage/cart.png";

import {
  getSceneAsset,
} from "./sceneAssets";

export default function Cart({
  children,
  serviceId,
  sceneObject,
  products = [],
}) {
  const visibleProducts = products
    .map((product) => ({
      ...product,
      sceneImage: getSceneAsset(
        product.assets?.scene
      ),
    }))
    .filter((product) => product.sceneImage);

  return (
    <div
      className="event-scene-cart"
      data-service-id={serviceId}
    >
      <img
        src={cartImage}
        alt={
          sceneObject?.serviceName ??
          "Carrinho Roda Festa"
        }
        className="event-scene-cart__image"
      />

      {visibleProducts.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "29%",
            left: "18%",
            right: "18%",
            zIndex: 4,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "4%",
            height: "27%",
            pointerEvents: "none",
          }}
        >
          {visibleProducts.map((product) => (
            <img
              key={product.id}
              src={product.sceneImage}
              alt={product.name}
              title={product.name}
              style={{
                display: "block",
                width:
                  visibleProducts.length >= 4
                    ? "22%"
                    : visibleProducts.length === 3
                      ? "27%"
                      : visibleProducts.length === 2
                        ? "38%"
                        : "48%",
                maxHeight: "100%",
                objectFit: "contain",
                filter:
                  "drop-shadow(0 7px 10px rgba(0, 0, 0, 0.34))",
              }}
            />
          ))}
        </div>
      )}

      {children && (
        <div className="event-scene-cart__content">
          {children}
        </div>
      )}
    </div>
  );
}