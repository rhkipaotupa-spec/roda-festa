import tableImage from "../stage/sweets-table/table.png";
import cakeImage from "../stage/sweets-table/cake.png";
import brigadeiroImage from "../stage/sweets-table/brigadeiro.png";
import decorationImage from "../stage/sweets-table/decoration.png";

export default function DessertTable({ config }) {
  if (!config?.visible) {
    return null;
  }

  return (
    <div className="stage-v2-dessert">
      <img
        src={tableImage}
        alt="Mesa de doces"
        className="stage-v2-dessert__table"
      />

      <div className="stage-v2-dessert__setup">
        {config.decoration && (
          <img
            src={decorationImage}
            alt="Decoração da mesa"
            className="stage-v2-dessert__decoration"
          />
        )}

        {config.cake && (
          <img
            src={cakeImage}
            alt="Bolo"
            className="stage-v2-dessert__cake"
          />
        )}

        {config.brigadeiro && (
          <img
            src={brigadeiroImage}
            alt="Brigadeiros"
            className="stage-v2-dessert__brigadeiro"
          />
        )}
      </div>
    </div>
  );
}