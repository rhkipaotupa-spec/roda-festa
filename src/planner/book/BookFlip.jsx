export default function BookFlip({
  direction = "forward",
  transitionKey = 0,
  children,
}) {
  return (
    <div
      key={transitionKey}
      className={`book-flip book-flip--${direction}`}
    >
      <div className="book-flip__shadow" aria-hidden="true" />
      <div className="book-flip__content">{children}</div>
    </div>
  );
}