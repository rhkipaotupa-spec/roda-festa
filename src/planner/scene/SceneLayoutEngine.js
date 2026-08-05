/* =========================================================
   SCENE LAYOUT ENGINE

   Responsabilidade:
   - expandir quantidades;
   - separar os tipos de elementos;
   - distribuir papéis visuais;
   - traduzir slots semânticos em posição, escala e profundidade.

   Nenhum componente visual precisa conhecer coordenadas.
   ========================================================= */

const DEFAULT_LAYOUT = {
  x: 50,
  y: 70,
  scale: 1,
  zIndex: 10,
  delay: 0,
  slot: "center",
};

const CART_COMPOSITIONS = {
  1: {
    withoutDessert: [
      {
        slot: "hero-center",
        x: 61,
        y: 71,
        scale: 1.02,
        depth: "front",
        role: "hero",
      },
    ],

    withDessert: [
      {
        slot: "hero-right",
        x: 67,
        y: 72,
        scale: 0.94,
        depth: "front",
        role: "hero",
      },
    ],
  },

  2: {
    withoutDessert: [
      {
        slot: "hero-left",
        x: 50,
        y: 73,
        scale: 0.9,
        depth: "front",
        role: "hero",
      },
      {
        slot: "support-right",
        x: 76,
        y: 69,
        scale: 0.76,
        depth: "middle",
        role: "support",
      },
    ],

    withDessert: [
      {
        slot: "hero-center",
        x: 57,
        y: 73,
        scale: 0.87,
        depth: "front",
        role: "hero",
      },
      {
        slot: "support-right",
        x: 79,
        y: 69,
        scale: 0.7,
        depth: "middle",
        role: "support",
      },
    ],
  },

  3: {
    withoutDessert: [
      {
        slot: "hero-center",
        x: 58,
        y: 73,
        scale: 0.78,
        depth: "front",
        role: "hero",
      },
      {
        slot: "support-left",
        x: 36,
        y: 69,
        scale: 0.64,
        depth: "middle",
        role: "support",
      },
      {
        slot: "support-right",
        x: 79,
        y: 68,
        scale: 0.62,
        depth: "middle",
        role: "support",
      },
    ],

    withDessert: [
      {
        slot: "hero-center",
        x: 58,
        y: 74,
        scale: 0.74,
        depth: "front",
        role: "hero",
      },
      {
        slot: "support-left",
        x: 40,
        y: 68,
        scale: 0.58,
        depth: "middle",
        role: "support",
      },
      {
        slot: "support-right",
        x: 78,
        y: 67,
        scale: 0.57,
        depth: "middle",
        role: "support",
      },
    ],
  },

  4: {
    withoutDessert: [
      {
        slot: "hero-center-left",
        x: 50,
        y: 74,
        scale: 0.68,
        depth: "front",
        role: "hero",
      },
      {
        slot: "hero-center-right",
        x: 68,
        y: 73,
        scale: 0.65,
        depth: "front",
        role: "support",
      },
      {
        slot: "rear-left",
        x: 35,
        y: 65,
        scale: 0.5,
        depth: "back",
        role: "support",
      },
      {
        slot: "rear-right",
        x: 83,
        y: 64,
        scale: 0.48,
        depth: "back",
        role: "support",
      },
    ],

    withDessert: [
      {
        slot: "hero-center-left",
        x: 52,
        y: 74,
        scale: 0.64,
        depth: "front",
        role: "hero",
      },
      {
        slot: "hero-center-right",
        x: 70,
        y: 72,
        scale: 0.61,
        depth: "front",
        role: "support",
      },
      {
        slot: "rear-center",
        x: 61,
        y: 61,
        scale: 0.46,
        depth: "back",
        role: "support",
      },
      {
        slot: "rear-right",
        x: 84,
        y: 63,
        scale: 0.44,
        depth: "back",
        role: "support",
      },
    ],
  },
};

const DESSERT_LAYOUTS = {
  noCarts: {
    slot: "dessert-center",
    x: 58,
    y: 73,
    scale: 1.05,
    depth: "front",
    role: "hero",
  },

  oneCart: {
    slot: "dessert-left",
    x: 28,
    y: 73,
    scale: 0.82,
    depth: "middle",
    role: "support",
  },

  twoCarts: {
    slot: "dessert-left",
    x: 25,
    y: 74,
    scale: 0.75,
    depth: "middle",
    role: "support",
  },

  manyCarts: {
    slot: "dessert-far-left",
    x: 19,
    y: 72,
    scale: 0.62,
    depth: "middle",
    role: "support",
  },
};

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(
    1,
    Math.floor(quantity)
  );
}

function expandSceneObjects(
  sceneObjects = []
) {
  const safeObjects =
    Array.isArray(sceneObjects)
      ? sceneObjects
      : [];

  return safeObjects.flatMap(
    (sceneObject) => {
      const quantity =
        normalizeQuantity(
          sceneObject.quantity
        );

      return Array.from(
        { length: quantity },
        (_, index) => ({
          ...sceneObject,

          quantity: 1,

          instanceId:
            `${sceneObject.id}-${index + 1}`,

          instanceIndex: index,

          sourceQuantity:
            quantity,
        })
      );
    }
  );
}

function separateObjects(objects) {
  return {
    carts: objects.filter(
      (object) =>
        object.component === "Cart"
    ),

    desserts: objects.filter(
      (object) =>
        object.component ===
        "DessertTable"
    ),

    others: objects.filter(
      (object) =>
        object.component !== "Cart" &&
        object.component !==
          "DessertTable"
    ),
  };
}

function getCompositionKey(
  hasDessert
) {
  return hasDessert
    ? "withDessert"
    : "withoutDessert";
}

function getCartComposition({
  totalCarts,
  hasDessert,
}) {
  const supportedTotal =
    Math.min(
      Math.max(totalCarts, 1),
      4
    );

  const composition =
    CART_COMPOSITIONS[
      supportedTotal
    ];

  return composition[
    getCompositionKey(
      hasDessert
    )
  ];
}

function buildDirectorData({
  sceneObject,
  role,
  depth,
}) {
  return {
    ...(sceneObject.director ?? {}),

    role:
      role ??
      sceneObject.director?.role ??
      "support",

    depth:
      depth ??
      sceneObject.director?.depth ??
      "middle",
  };
}

function calculateZIndex({
  depth,
  y,
  index,
}) {
  const depthBase = {
    back: 10,
    middle: 20,
    front: 30,
  };

  const base =
    depthBase[depth] ?? 20;

  /*
   * Elementos mais baixos na tela ficam
   * ligeiramente à frente.
   */
  return (
    base +
    Math.round(y / 10) +
    index
  );
}

function applyLayout({
  sceneObject,
  layout,
  index,
  delayBase,
  delayStep,
}) {
  const safeLayout = {
    ...DEFAULT_LAYOUT,
    ...layout,
  };

  return {
    ...sceneObject,

    director:
      buildDirectorData({
        sceneObject,

        role:
          safeLayout.role,

        depth:
          safeLayout.depth,
      }),

    layout: {
      x:
        safeLayout.x,

      y:
        safeLayout.y,

      scale:
        safeLayout.scale,

      slot:
        safeLayout.slot,

      zIndex:
        calculateZIndex({
          depth:
            safeLayout.depth,

          y:
            safeLayout.y,

          index,
        }),

      delay:
        delayBase +
        index * delayStep,
    },
  };
}

function layoutCarts({
  carts,
  hasDessert,
}) {
  if (carts.length === 0) {
    return [];
  }

  const composition =
    getCartComposition({
      totalCarts:
        carts.length,

      hasDessert,
    });

  return carts.map(
    (cart, index) => {
      /*
       * Para mais de quatro carrinhos,
       * reutilizamos os quatro slots e
       * criamos uma fileira recuada.
       */
      const slotIndex =
        index %
        composition.length;

      const row =
        Math.floor(
          index /
            composition.length
        );

      const baseLayout =
        composition[
          slotIndex
        ];

      const rowOffset =
        row * 11;

      return applyLayout({
        sceneObject: cart,

        index,

        delayBase: 260,

        delayStep: 170,

        layout: {
          ...baseLayout,

          y:
            baseLayout.y -
            rowOffset,

          scale:
            baseLayout.scale *
            Math.max(
              0.7,
              1 -
                row * 0.12
            ),

          depth:
            row > 0
              ? "back"
              : baseLayout.depth,

          role:
            index === 0
              ? "hero"
              : "support",

          slot:
            row > 0
              ? `${baseLayout.slot}-row-${row + 1}`
              : baseLayout.slot,
        },
      });
    }
  );
}

function getDessertLayout(
  totalCarts
) {
  if (totalCarts === 0) {
    return DESSERT_LAYOUTS.noCarts;
  }

  if (totalCarts === 1) {
    return DESSERT_LAYOUTS.oneCart;
  }

  if (totalCarts === 2) {
    return DESSERT_LAYOUTS.twoCarts;
  }

  return DESSERT_LAYOUTS.manyCarts;
}

function layoutDesserts({
  desserts,
  totalCarts,
}) {
  const baseLayout =
    getDessertLayout(
      totalCarts
    );

  return desserts.map(
    (dessert, index) =>
      applyLayout({
        sceneObject:
          dessert,

        index,

        delayBase: 620,

        delayStep: 140,

        layout: {
          ...baseLayout,

          x:
            baseLayout.x +
            index * 7,

          y:
            baseLayout.y -
            index * 8,

          scale:
            baseLayout.scale *
            Math.max(
              0.78,
              1 -
                index * 0.08
            ),

          slot:
            index === 0
              ? baseLayout.slot
              : `${baseLayout.slot}-${index + 1}`,
        },
      })
  );
}

function layoutOthers(others) {
  const SUPPORT_SLOTS = [
    {
      slot: "ambient-left",
      x: 24,
      y: 51,
      scale: 0.76,
      depth: "back",
      role: "ambient",
    },
    {
      slot: "ambient-right",
      x: 82,
      y: 48,
      scale: 0.72,
      depth: "back",
      role: "ambient",
    },
    {
      slot: "ambient-center",
      x: 57,
      y: 43,
      scale: 0.68,
      depth: "back",
      role: "ambient",
    },
  ];

  return others.map(
    (object, index) => {
      const slot =
        SUPPORT_SLOTS[
          index %
            SUPPORT_SLOTS.length
        ];

      const row =
        Math.floor(
          index /
            SUPPORT_SLOTS.length
        );

      return applyLayout({
        sceneObject:
          object,

        index,

        delayBase: 840,

        delayStep: 120,

        layout: {
          ...slot,

          y:
            slot.y -
            row * 9,

          scale:
            slot.scale *
            Math.max(
              0.72,
              1 -
                row * 0.08
            ),
        },
      });
    }
  );
}

export function buildSceneLayout(
  sceneObjects = []
) {
  const expandedObjects =
    expandSceneObjects(
      sceneObjects
    );

  const {
    carts,
    desserts,
    others,
  } =
    separateObjects(
      expandedObjects
    );

  const laidOutCarts =
    layoutCarts({
      carts,

      hasDessert:
        desserts.length > 0,
    });

  const laidOutDesserts =
    layoutDesserts({
      desserts,

      totalCarts:
        carts.length,
    });

  const laidOutOthers =
    layoutOthers(
      others
    );

  /*
   * A ordem do array não controla a profundidade.
   * O z-index calculado em cada layout faz isso.
   */
  return [
    ...laidOutOthers,
    ...laidOutDesserts,
    ...laidOutCarts,
  ];
}

export const SceneLayoutEngine = {
  build:
    buildSceneLayout,
};

export default SceneLayoutEngine;