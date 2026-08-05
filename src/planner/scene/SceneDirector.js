import SceneLayoutEngine from "./SceneLayoutEngine";

const EVENT_ATMOSPHERES = {
  infantil: {
    showBalloons: true,
    showFlowers: false,
    showCorporatePanels: false,
    tone: "warm",
  },

  casamento: {
    showBalloons: false,
    showFlowers: true,
    showCorporatePanels: false,
    tone: "elegant",
  },

  corporativo: {
    showBalloons: false,
    showFlowers: false,
    showCorporatePanels: true,
    tone: "corporate",
  },

  neutral: {
    showBalloons: false,
    showFlowers: false,
    showCorporatePanels: false,
    tone: "neutral",
  },
};

function normalizeEventType(eventType) {
  if (
    eventType &&
    Object.prototype.hasOwnProperty.call(
      EVENT_ATMOSPHERES,
      eventType
    )
  ) {
    return eventType;
  }

  return "neutral";
}

function getObjectRole({
  sceneObject,
  cartIndex,
  totalCarts,
}) {
  if (
    sceneObject.component ===
    "DessertTable"
  ) {
    return "support";
  }

  if (
    sceneObject.component !== "Cart"
  ) {
    return "ambient";
  }

  if (totalCarts === 1) {
    return "hero";
  }

  if (cartIndex === 0) {
    return "hero";
  }

  return "support";
}

function getObjectDepth({
  sceneObject,
  cartIndex,
  totalCarts,
}) {
  if (
    sceneObject.component ===
    "DessertTable"
  ) {
    return "middle";
  }

  if (
    sceneObject.component !== "Cart"
  ) {
    return "back";
  }

  if (totalCarts <= 1) {
    return "front";
  }

  if (cartIndex === 0) {
    return "front";
  }

  return "middle";
}

function getVisibleProductLimit(
  sceneObject
) {
  if (
    sceneObject.component !== "Cart"
  ) {
    return 0;
  }

  return 2;
}

function directObjects(
  sceneObjects = []
) {
  const safeObjects =
    Array.isArray(sceneObjects)
      ? sceneObjects
      : [];

  const totalCarts =
    safeObjects.filter(
      (sceneObject) =>
        sceneObject.component ===
        "Cart"
    ).length;

  let cartIndex = 0;

  return safeObjects.map(
    (sceneObject) => {
      const currentCartIndex =
        sceneObject.component === "Cart"
          ? cartIndex
          : -1;

      if (
        sceneObject.component === "Cart"
      ) {
        cartIndex += 1;
      }

      return {
        ...sceneObject,

        director: {
          role:
            getObjectRole({
              sceneObject,
              cartIndex:
                currentCartIndex,
              totalCarts,
            }),

          depth:
            getObjectDepth({
              sceneObject,
              cartIndex:
                currentCartIndex,
              totalCarts,
            }),

          visibleProductLimit:
            getVisibleProductLimit(
              sceneObject
            ),

          priority:
            sceneObject.component ===
            "Cart"
              ? currentCartIndex
              : 99,
        },
      };
    }
  );
}

function buildAtmosphere(eventType) {
  const normalizedEventType =
    normalizeEventType(eventType);

  return {
    ...EVENT_ATMOSPHERES[
      normalizedEventType
    ],

    eventType:
      normalizedEventType,
  };
}

export function directScene({
  sceneObjects = [],
  eventType = "neutral",
}) {
  const directedObjects =
    directObjects(sceneObjects);

  const layoutObjects =
    SceneLayoutEngine.build(
      directedObjects
    );

  return {
    atmosphere:
      buildAtmosphere(eventType),

    objects:
      layoutObjects,
  };
}

export const SceneDirector = {
  direct:
    directScene,
};

export default SceneDirector;