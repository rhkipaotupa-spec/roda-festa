export default function SceneBackground() {
  return (
    <div className="event-scene__background" aria-hidden="true">
      <div className="event-scene__light event-scene__light--left" />
      <div className="event-scene__light event-scene__light--right" />
      <div className="event-scene__particles" />
    </div>
  );
}