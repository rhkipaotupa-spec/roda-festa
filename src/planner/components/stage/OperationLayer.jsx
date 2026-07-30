export default function Operation({ operation, slot = "center" }) {
  if (!operation) {
    return null;
  }

  return (
    <div className={`cart-operation cart-operation--${slot}`}>
      <img
        src={operation.equipment.image}
        alt={operation.equipment.alt}
        className="cart-operation__equipment"
      />

      <img
        src={operation.food.image}
        alt={operation.food.alt}
        className="cart-operation__food"
      />
    </div>
  );
}