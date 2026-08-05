import { useMemo, useState } from "react";

import cartImage from "../components/stage/cart.png";

import { getSceneAsset } from "./sceneAssets";
import "./CartDetails.css";

const PRODUCT_PRESENTATION = {
  burger: {
    className: "burger",
    scale: 1.16,
    rotate: -3,
    offsetY: 5,
  },

  "hot-dog": {
    className: "hot-dog",
    scale: 1.12,
    rotate: 3,
    offsetY: 6,
  },

  pastel: {
    className: "pastel",
    scale: 1.2,
    rotate: -2,
    offsetY: 8,
  },

  "mini-pie": {
    className: "mini-pie",
    scale: 1.12,
    rotate: 2,
    offsetY: 7,
  },
};

function normalizeProducts(products = []) {
  return products
    .map((product) => {
      const assetId = product.assets?.scene;
      const sceneImage = getSceneAsset(assetId);

      if (!sceneImage) {
        return null;
      }

      return {
        ...product,
        assetId,
        sceneImage,

        presentation:
          PRODUCT_PRESENTATION[assetId] ?? {
            className: "generic",
            scale: 1,
            rotate: 0,
            offsetY: 6,
          },
      };
    })
    .filter(Boolean);
}

function selectRepresentativeProducts(
  products = [],
  limit = 2
) {
  const seenAssets = new Set();

  return normalizeProducts(products)
    .filter((product) => {
      const assetKey =
        product.assetId ?? product.id;

      if (seenAssets.has(assetKey)) {
        return false;
      }

      seenAssets.add(assetKey);
      return true;
    })
    .slice(0, limit);
}

function getCartClassName({
  role,
  depth,
  serviceId,
  isDetailsVisible,
}) {
  return [
    "event-scene-cart",
    `event-scene-cart--${role}`,
    `event-scene-cart--${depth}`,

    serviceId
      ? `event-scene-cart--service-${serviceId}`
      : "",

    isDetailsVisible
      ? "event-scene-cart--details-visible"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return null;
  }

  return quantity;
}

function getProductQuantity(product) {
  return normalizeQuantity(
    product.quantity ??
      product.suggestedQuantity ??
      product.recommendedQuantity ??
      product.units
  );
}

function formatQuantity(product) {
  const quantity =
    getProductQuantity(product);

  if (quantity === null) {
    return "Quantidade a definir";
  }

  const measurementUnit = String(
    product.measurementUnit ??
      product.unit ??
      "unit"
  ).toLowerCase();

  const kilogramUnits = [
    "kg",
    "kilogram",
    "kilograms",
    "quilograma",
  ];

  if (
    kilogramUnits.includes(
      measurementUnit
    )
  ) {
    return `${quantity.toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          quantity % 1 === 0 ? 0 : 1,

        maximumFractionDigits: 2,
      }
    )} kg`;
  }

  return `${quantity.toLocaleString(
    "pt-BR"
  )} ${
    quantity === 1
      ? "unidade"
      : "unidades"
  }`;
}

export default function Cart({
  serviceId,
  sceneObject,
  products = [],
}) {
  const [
    isPinned,
    setIsPinned,
  ] = useState(false);

  const [
    isHovered,
    setIsHovered,
  ] = useState(false);

  const [
    isFocusWithin,
    setIsFocusWithin,
  ] = useState(false);

  const role =
    sceneObject?.director?.role ??
    "support";

  const depth =
    sceneObject?.director?.depth ??
    "front";

  const visibleProductLimit =
    Math.min(
      2,
      sceneObject?.director
        ?.visibleProductLimit ?? 2
    );

  const visibleProducts =
    useMemo(
      () =>
        selectRepresentativeProducts(
          products,
          visibleProductLimit
        ),
      [
        products,
        visibleProductLimit,
      ]
    );

  const detailsProducts =
    useMemo(
      () =>
        products.filter(
          (
            product,
            index,
            allProducts
          ) =>
            product?.id &&
            allProducts.findIndex(
              (item) =>
                item.id === product.id
            ) === index
        ),
      [products]
    );

  const isDetailsVisible =
    isPinned ||
    isHovered ||
    isFocusWithin;

  const panelId =
    `cart-details-${
      sceneObject?.instanceId ??
      sceneObject?.id ??
      serviceId
    }`;

  const stationName =
    sceneObject?.serviceName ??
    "Estação Roda Festa";

  function handleBlur(event) {
    const newFocusedElement =
      event.relatedTarget;

    if (
      !event.currentTarget.contains(
        newFocusedElement
      )
    ) {
      setIsFocusWithin(false);
    }
  }

  return (
    <div
      className={getCartClassName({
        role,
        depth,
        serviceId,
        isDetailsVisible,
      })}
      data-service-id={serviceId}
      data-role={role}
      onMouseEnter={() =>
        setIsHovered(true)
      }
      onMouseLeave={() =>
        setIsHovered(false)
      }
      onFocusCapture={() =>
        setIsFocusWithin(true)
      }
      onBlurCapture={handleBlur}
    >
      <div
        className="event-scene-cart__contact-shadow"
        aria-hidden="true"
      />

      <div
        className="event-scene-cart__ambient-glow"
        aria-hidden="true"
      />

      <img
        src={cartImage}
        alt={stationName}
        className="event-scene-cart__image"
      />

      {visibleProducts.length > 0 && (
        <div
          className={[
            "event-scene-cart__counter-display",
            `event-scene-cart__counter-display--${visibleProducts.length}`,
          ].join(" ")}
          aria-hidden="true"
        >
          {visibleProducts.map(
            (
              product,
              index
            ) => {
              const {
                presentation,
              } = product;

              return (
                <figure
                  key={product.id}
                  className={[
                    "event-scene-cart__product",
                    `event-scene-cart__product--slot-${index + 1}`,
                    `event-scene-cart__product--${presentation.className}`,
                  ].join(" ")}
                  style={{
                    "--product-scale":
                      presentation.scale,

                    "--product-rotate":
                      `${presentation.rotate}deg`,

                    "--product-offset-y":
                      `${presentation.offsetY}%`,

                    "--product-delay":
                      `${180 + index * 150}ms`,
                  }}
                >
                  <span className="event-scene-cart__product-shadow" />

                  <img
                    src={
                      product.sceneImage
                    }
                    alt=""
                  />
                </figure>
              );
            }
          )}
        </div>
      )}

      {detailsProducts.length > 0 && (
        <div className="event-scene-cart__details-trigger-wrap">
          <button
            type="button"
            className="event-scene-cart__details-trigger"
            aria-expanded={
              isDetailsVisible
            }
            aria-controls={panelId}
            onClick={() =>
              setIsPinned(
                (currentValue) =>
                  !currentValue
              )
            }
          >
            <span
              className="event-scene-cart__details-trigger-icon"
              aria-hidden="true"
            >
              i
            </span>

            <span>
              {isPinned
                ? "Ocultar composição"
                : "Ver composição"}
            </span>

            <span
              className="event-scene-cart__details-trigger-arrow"
              aria-hidden="true"
            >
              {isPinned ? "−" : "+"}
            </span>
          </button>
        </div>
      )}

      {detailsProducts.length > 0 && (
        <aside
          id={panelId}
          className="event-scene-cart__details-panel"
          aria-hidden={
            !isDetailsVisible
          }
        >
          <div className="event-scene-cart__details-header">
            <div>
              <span className="event-scene-cart__details-eyebrow">
                Estrutura sugerida
              </span>

              <strong>
                {stationName}
              </strong>
            </div>

            {isPinned && (
              <button
                type="button"
                className="event-scene-cart__details-close"
                aria-label="Fechar composição do carrinho"
                onClick={() =>
                  setIsPinned(false)
                }
              >
                ×
              </button>
            )}
          </div>

          <ul className="event-scene-cart__details-list">
            {detailsProducts.map(
              (product) => (
                <li key={product.id}>
                  <span className="event-scene-cart__details-product-name">
                    {product.name}
                  </span>

                  <strong className="event-scene-cart__details-product-quantity">
                    {formatQuantity(
                      product
                    )}
                  </strong>
                </li>
              )
            )}
          </ul>

          <p className="event-scene-cart__details-hint">
            Passe o mouse para
            visualizar ou clique em
            “Ver composição” para
            manter este painel aberto.
          </p>
        </aside>
      )}
    </div>
  );
}