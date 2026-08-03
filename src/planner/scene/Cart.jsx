import cartImage from "../components/stage/cart.png";

import { getSceneAsset } from "./sceneAssets";

function selectRepresentativeProducts(products = [], limit = 2) {
  const seenAssets = new Set();

  return products
    .map((product) => ({
      ...product,
      sceneImage: getSceneAsset(product.assets?.scene),
    }))
    .filter((product) => {
      if (!product.sceneImage) {
        return false;
      }

      const assetKey = product.assets?.scene ?? product.id;

      if (seenAssets.has(assetKey)) {
        return false;
      }

      seenAssets.add(assetKey);
      return true;
    })
    .slice(0, limit);
}

export default function Cart({
  serviceId,
  sceneObject,
  products = [],
}) {
  const visibleProductLimit =
    sceneObject?.director?.visibleProductLimit ?? 2;

  const visibleProducts = selectRepresentativeProducts(
    products,
    visibleProductLimit
  );

  const allProductNames = products
    .map((product) => product.name)
    .filter(Boolean);

  return (
    <div
      className={[
        "event-scene-cart",
        `event-scene-cart--${sceneObject?.director?.depth ?? "front"}`,
      ].join(" ")}
      data-service-id={serviceId}
    >
      <img
        src={cartImage}
        alt={sceneObject?.serviceName ?? "Carrinho Roda Festa"}
        className="event-scene-cart__image"
      />

      {visibleProducts.length > 0 && (
        <div className="event-scene-cart__products" aria-hidden="true">
          {visibleProducts.map((product, index) => (
            <figure
              key={product.id}
              className={`event-scene-cart__product event-scene-cart__product--${index + 1}`}
            >
              <img src={product.sceneImage} alt="" />
            </figure>
          ))}
        </div>
      )}

      <div className="event-scene-cart__tooltip" role="tooltip">
        <strong>{sceneObject?.serviceName ?? "Carrinho Roda Festa"}</strong>

        {allProductNames.length > 0 && (
          <ul>
            {allProductNames.map((productName) => (
              <li key={productName}>{productName}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}