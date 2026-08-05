import "./EventScene.css";

import SceneBackground from "./SceneBackground";
import SceneFloor from "./SceneFloor";
import SceneDirector from "./SceneDirector";
import StageDecor from "./StageDecor";

import { getSceneComponent } from "./SceneRegistry";

function buildDessertConfig(products) {
  const safeProducts = Array.isArray(products) ? products : [];

  return {
    visible: safeProducts.some(
      (product) =>
        product.quantityRuleId === "cake-by-weight" ||
        product.quantityRuleId === "party-sweets"
    ),
    decoration: true,
    cake: safeProducts.some(
      (product) => product.quantityRuleId === "cake-by-weight"
    ),
    brigadeiro: safeProducts.some(
      (product) => product.quantityRuleId === "party-sweets"
    ),
  };
}

function buildComponentProps({ sceneObject, dessertConfig, products }) {
  if (sceneObject.component === "DessertTable") {
    return { config: dessertConfig };
  }

  if (sceneObject.component === "Cart") {
    return {
      products: products.filter(
        (product) => product.serviceId === sceneObject.serviceId
      ),
    };
  }

  return {};
}

function renderSceneObject({ sceneObject, dessertConfig, products }) {
  const SceneComponent = getSceneComponent(sceneObject.component);

  if (!SceneComponent) {
    console.warn(
      `Componente de cena não encontrado: ${sceneObject.component}`
    );
    return null;
  }

  if (
    sceneObject.component === "DessertTable" &&
    !dessertConfig.visible
  ) {
    return null;
  }

  const componentProps = buildComponentProps({
    sceneObject,
    dessertConfig,
    products,
  });

  const objectStyle = {
    "--scene-x": `${sceneObject.layout?.x ?? 50}%`,
    "--scene-y": `${sceneObject.layout?.y ?? 70}%`,
    "--scene-scale": sceneObject.layout?.scale ?? 1,
    "--scene-delay": `${sceneObject.layout?.delay ?? 0}ms`,
    zIndex: sceneObject.layout?.zIndex ?? 1,
  };

  return (
    <div
      key={sceneObject.instanceId ?? sceneObject.id}
      className={[
        "event-scene__object",
        `event-scene__object--${sceneObject.director?.role ?? "support"}`,
        `event-scene__object--${sceneObject.director?.depth ?? "front"}`,
        `event-scene__object--${sceneObject.component
          .replace(/([a-z])([A-Z])/g, "$1-$2")
          .toLowerCase()}`,
      ].join(" ")}
      style={objectStyle}
    >
      <SceneComponent
        {...componentProps}
        sceneObject={sceneObject}
        serviceId={sceneObject.serviceId}
        variant={sceneObject.visual?.variant}
        theme={sceneObject.visual?.theme}
        instanceIndex={sceneObject.instanceIndex ?? 0}
      />
    </div>
  );
}

export default function EventScene({ plannerResult }) {
  const scene = plannerResult?.scene ?? {
    objects: [],
    notes: [],
  };

  const products = plannerResult?.composition?.products ?? [];
  const eventType = plannerResult?.event?.type ?? "neutral";
  const dessertConfig = buildDessertConfig(products);

  const directedScene = SceneDirector.direct({
    sceneObjects: scene.objects,
    eventType,
  });

  return (
    <section className={`event-scene event-scene--${eventType}`}>
      <SceneBackground />
      <SceneFloor />
      <StageDecor atmosphere={directedScene.atmosphere} />

      <div className="event-scene__content">
        {directedScene.objects.map((sceneObject) =>
          renderSceneObject({
            sceneObject,
            dessertConfig,
            products,
          })
        )}
      </div>
    </section>
  );
}