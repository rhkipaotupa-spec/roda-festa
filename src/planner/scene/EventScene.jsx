import "./EventScene.css";

import SceneBackground from "./SceneBackground";
import SceneFloor from "./SceneFloor";

import SceneLayoutEngine from "./SceneLayoutEngine";

import {
  getSceneComponent,
} from "./SceneRegistry";

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}


function buildDessertConfig(products) {
  const safeProducts = Array.isArray(products)
    ? products
    : [];

  const hasCake = safeProducts.some(
    (product) =>
      product.quantityRuleId ===
      "cake-by-weight"
  );

  const hasPartySweets = safeProducts.some(
    (product) =>
      product.quantityRuleId ===
      "party-sweets"
  );

  return {
    visible: hasCake || hasPartySweets,
    decoration: true,
    cake: hasCake,
    brigadeiro: hasPartySweets,
  };
}



function buildComponentProps({
  sceneObject,
  dessertConfig,
  products,
}) {

  if (
    sceneObject.component ===
    "DessertTable"
  ) {
    return {
      config: dessertConfig,
    };
  }

  if (
    sceneObject.component ===
    "Cart"
  ) {

    return {

      products:
        products.filter(
          (product) =>
            product.serviceId ===
            sceneObject.serviceId
        ),

    };

  }

  return {};

}



function renderSceneObject({
  sceneObject,
  dessertConfig,
  products,
}) {
  const SceneComponent =
    getSceneComponent(
      sceneObject.component
    );

  if (!SceneComponent) {
    console.warn(
      `Componente de cena não encontrado: ${sceneObject.component}`
    );

    return null;
  }

  if (
    sceneObject.component ===
      "DessertTable" &&
    !dessertConfig.visible
  ) {
    return null;
  }

  const quantity = Math.max(
    1,
    Number(sceneObject.quantity) || 1
  );


const componentProps =
  buildComponentProps({
    sceneObject,
    dessertConfig,
    products,
  });

  const objectStyle = {
    position: "absolute",
    left: `${sceneObject.layout?.x ?? 50}%`,
    top: `${sceneObject.layout?.y ?? 70}%`,
    transform: `
      translate(-50%, -50%)
      scale(${sceneObject.layout?.scale ?? 1})
    `,
    zIndex:
      sceneObject.layout?.zIndex ?? 1,
  };

  return Array.from(
    { length: quantity },
    (_, index) => (
      <div
        key={`${sceneObject.id}-${index}`}
        className="event-scene__object"
        style={objectStyle}
      >
        <SceneComponent
          {...componentProps}
          sceneObject={sceneObject}
          serviceId={sceneObject.serviceId}
          variant={
            sceneObject.visual?.variant
          }
          theme={
            sceneObject.visual?.theme
          }
          instanceIndex={index}
        />
      </div>
    )
  );
}

export default function EventScene({
  plannerResult,
}) {
  const scene = plannerResult?.scene ?? {
    objects: [],
    notes: [],
  };

  const products =
    plannerResult?.composition?.products ?? [];

  const dessertConfig =
    buildDessertConfig(products);

    const layoutObjects =
  SceneLayoutEngine.build(scene.objects);

console.log(
  "LAYOUT OBJECTS:",
  layoutObjects
);

  const totalStructures =
    plannerResult?.composition?.structures
      ?.reduce(
        (total, structure) =>
          total +
          (Number(structure.quantity) || 0),
        0
      ) ?? 0;

  return (
    <section className="event-scene">
      <SceneBackground />
      <SceneFloor />

<div className="event-scene__content">


{layoutObjects.map((sceneObject) =>
  renderSceneObject({
    sceneObject,
    dessertConfig,
    products,
  })
)}



</div>

      <div className="event-scene__label">
        Planner visual
      </div>

      <div className="event-scene__summary">
        <strong>Resumo do evento</strong>

        {!plannerResult?.event?.type ? (
          <span>
            Escolha um tipo de evento para iniciar.
          </span>
        ) : (
          <span>
            {products.length} produto(s) e{" "}
            {totalStructures} estrutura(s)
            sugeridos.
          </span>
        )}
      </div>

      {scene.notes?.map((note) => (
        <div
          key={note.id}
          className="event-scene__note"
        >
          {note.message}
        </div>
      ))}
    </section>
  );
}