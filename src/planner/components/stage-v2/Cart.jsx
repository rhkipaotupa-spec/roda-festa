import cartImage from "../stage/cart.png";
import OperationLayer from "./OperationLayer";

export default function Cart({ operations = [] }) {
  return (
    <div className="stage-v2-cart">
      <img
        src={cartImage}
        alt="Carrinho Roda Festa"
        className="stage-v2-cart__image"
      />

      <OperationLayer operations={operations} />
    </div>
  );
}