import burgerImage from "../components/stage/food/burger.png";
import hotDogImage from "../components/stage/food/hot-dog.png";
import miniPieImage from "../components/stage/food/mini-pie.png";
import pastelImage from "../components/stage/food/pastel.png";

import brigadeiroImage from "../components/stage/sweets-table/brigadeiro.png";
import cakeImage from "../components/stage/sweets-table/cake.png";
import decorationImage from "../components/stage/sweets-table/decoration.png";
import tableImage from "../components/stage/sweets-table/table.png";

export const sceneAssets = {
  burger: burgerImage,
  "hot-dog": hotDogImage,
  "mini-pie": miniPieImage,
  pastel: pastelImage,

  brigadeiro: brigadeiroImage,
  cake: cakeImage,
  decoration: decorationImage,
  table: tableImage,
};

export function getSceneAsset(assetId) {
  if (!assetId) {
    return null;
  }

  return sceneAssets[assetId] ?? null;
}

export default sceneAssets;