import tableImage from "../components/stage/sweets-table/table.png";
import cakeImage from "../components/stage/sweets-table/cake.png";
import brigadeiroImage from "../components/stage/sweets-table/brigadeiro.png";
import decorationImage from "../components/stage/sweets-table/decoration.png";

export default function DessertTable({ config }) {
  if (!config?.visible) {
    return null;
  }

  return (
    <div className="event-scene-dessert">
      <img
        src={tableImage}
        alt="Mesa de doces"
        className="event-scene-dessert__table"
      />

      <div className="event-scene-dessert__setup">
        {config.decoration && (
          <img
            src={decorationImage}
            alt=""
            aria-hidden="true"
            className="event-scene-dessert__decoration"
          />
        )}

        {config.cake && (
          <img
            src={cakeImage}
            alt="Bolo"
            className="event-scene-dessert__cake"
          />
        )}

        {config.brigadeiro && (
          <img
            src={brigadeiroImage}
            alt="Brigadeiros"
            className="event-scene-dessert__brigadeiro"
          />
        )}
      </div>
    </div>
  );
}