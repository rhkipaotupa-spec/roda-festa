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
  return sceneObjects.flatMap(
    (sceneObject) => {
      const quantity =
        normalizeQuantity(
          sceneObject.quantity
        );

      return Array.from(
        {
          length: quantity,
        },
        (_, index) => ({
          ...sceneObject,

          quantity: 1,

          instanceId:
            `${sceneObject.id}-${index + 1}`,

          instanceIndex: index,
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

function getCartPositions(
  totalCarts,
  hasDessert
) {
  if (totalCarts <= 1) {
    return [
      {
        x: hasDessert ? 63 : 56,
        y: 68,
        scale: hasDessert
          ? 0.9
          : 1.04,
      },
    ];
  }

  if (totalCarts === 2) {
    if (hasDessert) {
      return [
        {
          x: 48,
          y: 69,
          scale: 0.78,
        },
        {
          x: 74,
          y: 69,
          scale: 0.78,
        },
      ];
    }

    return [
      {
        x: 37,
        y: 69,
        scale: 0.88,
      },
      {
        x: 69,
        y: 69,
        scale: 0.88,
      },
    ];
  }

  if (totalCarts === 3) {
    if (hasDessert) {
      return [
        {
          x: 38,
          y: 71,
          scale: 0.66,
        },
        {
          x: 59,
          y: 67,
          scale: 0.72,
        },
        {
          x: 79,
          y: 71,
          scale: 0.66,
        },
      ];
    }

    return [
      {
        x: 27,
        y: 71,
        scale: 0.72,
      },
      {
        x: 52,
        y: 67,
        scale: 0.78,
      },
      {
        x: 76,
        y: 71,
        scale: 0.72,
      },
    ];
  }

  return [
    {
      x: 25,
      y: 71,
      scale: 0.61,
    },
    {
      x: 44,
      y: 67,
      scale: 0.66,
    },
    {
      x: 63,
      y: 67,
      scale: 0.66,
    },
    {
      x: 81,
      y: 71,
      scale: 0.61,
    },
  ];
}

function layoutDesserts(
  desserts,
  totalCarts
) {
  return desserts.map(
    (object, index) => ({
      ...object,

      layout: {
        x:
          totalCarts >= 3
            ? 15
            : 20,

        y:
          73 -
          index * 15,

        scale:
          totalCarts >= 3
            ? 0.7
            : 0.82,

        zIndex:
          28 + index,

        delay:
          620 +
          index * 120,
      },
    })
  );
}

function layoutCarts(
  carts,
  hasDessert
) {
  const positions =
    getCartPositions(
      carts.length,
      hasDessert
    );

  return carts.map(
    (object, index) => {
      const position =
        positions[
          index %
            positions.length
        ];

      const row =
        Math.floor(
          index /
            positions.length
        );

      return {
        ...object,

        layout: {
          x: position.x,

          y:
            position.y -
            row * 17,

          scale:
            position.scale *
            Math.max(
              0.72,
              1 -
                row * 0.08
            ),

          zIndex:
            20 +
            index -
            row,

          delay:
            220 +
            index * 170,
        },
      };
    }
  );
}

function layoutOthers(others) {
  return others.map(
    (object, index) => ({
      ...object,

      layout: {
        x: 50,

        y:
          55 -
          index * 10,

        scale: 0.8,

        zIndex:
          12 + index,

        delay:
          850 +
          index * 120,
      },
    })
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

  return [
    ...layoutCarts(
      carts,
      desserts.length > 0
    ),

    ...layoutDesserts(
      desserts,
      carts.length
    ),

    ...layoutOthers(
      others
    ),
  ];
}

export const SceneLayoutEngine = {
  build:
    buildSceneLayout,
};

export default SceneLayoutEngine;