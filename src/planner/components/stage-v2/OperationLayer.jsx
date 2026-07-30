import Operation from "./Operation";

const positions = ["left", "center", "right"];

export default function OperationLayer({ operations = [] }) {
  return (
    <div className="stage-v2-cart__operations">
      {operations.slice(0, 3).map((operation, index) => (
        <Operation
          key={operation.id}
          operation={operation}
          position={positions[index]}
        />
      ))}
    </div>
  );
}