import Cart from "./Cart";
import DessertTable from "./DessertTable";

export const SceneRegistry = {
  Cart,
  DessertTable,
};

export function getSceneComponent(componentName) {
  return SceneRegistry[componentName] ?? null;
}

export default SceneRegistry;