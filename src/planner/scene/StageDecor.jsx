export default function StageDecor({ atmosphere = {} }) {
  const {
    eventType = "neutral",
    showBalloons = false,
    showFlowers = false,
    showCorporatePanels = false,
  } = atmosphere;

  return (
    <div
      className={`event-scene__decor event-scene__decor--${eventType}`}
      aria-hidden="true"
    >
      <div className="event-scene__string-lights">
        {Array.from({ length: 9 }, (_, index) => (
          <i key={index} />
        ))}
      </div>

      <div className="event-scene__ambient-tables">
        <span />
        <span />
        <span />
      </div>

      <div className="event-scene__guest-silhouettes">
        <span />
        <span />
        <span />
        <span />
      </div>

      {showBalloons && (
        <div className="event-scene__balloons">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      )}

      {showFlowers && (
        <div className="event-scene__flowers">
          <span />
          <span />
          <span />
          <span />
        </div>
      )}

      {showCorporatePanels && (
        <div className="event-scene__corporate-panels">
          <span />
          <span />
        </div>
      )}
    </div>
  );
}