import "./Book.css";

export default function Book({ currentSheet = "briefing", direction = "forward", children }) {
  return (
    <div
      className={[
        "book-core",
        `book-core--sheet-${currentSheet}`,
        `book-core--direction-${direction}`,
      ].join(" ")}
      data-current-sheet={currentSheet}
    >
      <div className="planning-book__binding" aria-hidden="true" />
      {children}
    </div>
  );
}
