import tableImage from "./sweets-table/table.png";
import cakeImage from "./sweets-table/cake.png";
import brigadeiroImage from "./sweets-table/brigadeiro.png";
import decorationImage from "./sweets-table/decoration.png";

import { slots } from "./slots";

export default function SweetsTable({ config }) {
  if (!config?.visible) {
    return null;
  }

  return (
    <div className="stage__sweets-layer">
      <img
        src={tableImage}
        alt="Mesa de doces"
        className="stage__sweets-table"
        style={slots.sweetsTable.table}
      />

      {config.cake && (
        <img
          src={cakeImage}
          alt="Bolo"
          className="stage__sweet-item"
          style={slots.sweetsTable.cake}
        />
      )}

      {config.brigadeiro && (
        <img
          src={brigadeiroImage}
          alt="Brigadeiros"
          className="stage__sweet-item"
          style={slots.sweetsTable.brigadeiro}
        />
      )}

      {config.decoration && (
        <img
          src={decorationImage}
          alt="Decoração"
          className="stage__sweet-item"
          style={slots.sweetsTable.decoration}
        />
      )}
    </div>
  );
}