import burgerImage from "./food/burger.png";
import hotDogImage from "./food/hot-dog.png";
import miniPieImage from "./food/mini-pie.png";
import pastelImage from "./food/pastel.png";

import { slots } from "./slots";

const foodImages = {
  burger: burgerImage,
  hotDog: hotDogImage,
  miniPie: miniPieImage,
  pastel: pastelImage,
};

export default function ItemsLayer({ food = [] }) {
  return (
    <div className="stage__food-layer">
      {food.map((item, index) => {
        const slotNames = ["left", "center", "right"];
        const slotName = slotNames[index] ?? "center";
        const slot = slots.food[slotName];

        return (
          <img
            key={item}
            src={foodImages[item]}
            alt=""
            className="stage__food"
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