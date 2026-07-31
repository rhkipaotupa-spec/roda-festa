const DEFAULT_POSITIONS = {
  single: [
    {
      x: 50,
      y: 72,
      scale: 1,
    },
  ],

  double: [
    {
      x: 35,
      y: 72,
      scale: 0.9,
    },
    {
      x: 68,
      y: 72,
      scale: 0.9,
    },
  ],

  triple: [
    {
      x: 24,
      y: 72,
      scale: 0.82,
    },
    {
      x: 50,
      y: 72,
      scale: 0.82,
    },
    {
      x: 76,
      y: 72,
      scale: 0.82,
    },
  ],



multiple: [
  {
    x: 18,
    y: 68,
    scale: 0.68,
  },
  {
    x: 39,
    y: 68,
    scale: 0.68,
  },
  {
    x: 60,
    y: 68,
    scale: 0.68,
  },
  {
    x: 81,
    y: 68,
    scale: 0.68,
  },
],

};

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(1, Math.floor(quantity));
}

function expandSceneObjects(sceneObjects = []) {
  return sceneObjects.flatMap((sceneObject) => {
    const quantity = normalizeQuantity(
      sceneObject.quantity
    );

    return Array.from(
      { length: quantity },
      (_, index) => ({
        ...sceneObject,

        instanceId: `${sceneObject.id}-${index + 1}`,

        instanceIndex: index,
      })
    );
  });
}

function getPositions(totalObjects) {
  if (totalObjects <= 1) {
    return DEFAULT_POSITIONS.single;
  }

  if (totalObjects === 2) {
    return DEFAULT_POSITIONS.double;
  }

  if (totalObjects === 3) {
    return DEFAULT_POSITIONS.triple;
  }

  return DEFAULT_POSITIONS.multiple;
}

export function buildSceneLayout(
  sceneObjects = []
) {
  const expandedObjects =
    expandSceneObjects(sceneObjects);

  const positions = getPositions(
    expandedObjects.length
  );

  return expandedObjects.map(
    (sceneObject, index) => {
      const position =
        positions[
          index % positions.length
        ];

      const row = Math.floor(
        index / positions.length
      );

      return {
        ...sceneObject,

        layout: {
          x: position.x,
          y: position.y - row * 18,

          scale:
            position.scale *
            Math.max(
              0.6,
              1 - row * 0.08
            ),

          zIndex: 10 + row,
        },
      };
    }
  );
}

export const SceneLayoutEngine = {
  build: buildSceneLayout,
};

export default SceneLayoutEngine;