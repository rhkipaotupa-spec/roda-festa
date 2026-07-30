import fryerImage from "./equipment/fryer.png";
import griddleImage from "./equipment/griddle.png";
import miniOvenImage from "./equipment/mini-oven.png";
import stainlessPanImage from "./equipment/stainless-pan.png";
import drinkStationImage from "./equipment/drink-station.png";

import { slots } from "./slots";

const equipmentImages = {
  fryer: fryerImage,
  griddle: griddleImage,
  miniOven: miniOvenImage,
  stainlessPan: stainlessPanImage,
  drinkStation: drinkStationImage,
};

export default function EquipmentLayer({ equipment = [] }) {
  return (
    <div className="stage__equipment-layer">
      {equipment.map((item, index) => {
        const slotNames = ["left", "center", "right"];
        const slotName = slotNames[index] ?? "center";
        const slot = slots.equipment[slotName];

        return (
          <img
            key={item}
            src={equipmentImages[item]}
            alt=""
            className="stage__equipment"
            style={{
              left: slot.left,
              top: slot.top,
              width: slot.width,
            }}
          />
        );
      })}
    </div>
  );
}