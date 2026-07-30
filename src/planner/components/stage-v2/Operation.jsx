export default function Operation({ operation, position = "center" }) {
  if (!operation) {
    return null;
  }

  return (
    <div
      className={`stage-v2-operation stage-v2-operation--${position}`}
    >
      <img
        src={operation.equipment.image}
        alt={operation.equipment.alt}
        className="stage-v2-operation__equipment"
      />

      <img
        src={operation.food.image}
        alt={operation.food.alt}
        className="stage-v2-operation__food"
      />
    </div>
  );
}