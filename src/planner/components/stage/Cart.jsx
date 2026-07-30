import cartImage from "./cart.png";
import OperationLayer from "./OperationLayer";

export default function Cart({ state }) {
  return (
    <div className="stage__cart-wrapper">
      <img
        src={cartImage}
        alt="Carrinho Roda Festa"
        className="stage__cart"
      />

      <OperationLayer operations={state.operations} />
    </div>
  );
}