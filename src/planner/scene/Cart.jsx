import cartImage from "../components/stage/cart.png";

export default function Cart({ children }) {
  return (
    <div className="event-scene-cart">
      <img
        src={cartImage}
        alt="Carrinho Roda Festa"
        className="event-scene-cart__image"
      />

      {children && (
        <div className="event-scene-cart__content">
          {children}
        </div>
      )}
    </div>
  );
}