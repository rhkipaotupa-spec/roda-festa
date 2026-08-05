import "./Book.css";

import BookHeader from "./BookHeader";
import BookProgress from "./BookProgress";
import BookFooter from "./BookFooter";
import BookFlip from "./BookFlip";

export default function Book({
  currentSheet = "briefing",
  direction = "forward",
  transitionKey = 0,
  canGoBack = false,

  headerProps = {},

  onBack,
  onEdit,
  onRestart,

  children,
}) {
  const showNavigation =
    currentSheet !== "briefing";

  return (
    <div
      className={[
        "book-core",
        `book-core--sheet-${currentSheet}`,
        `book-core--direction-${direction}`,
      ].join(" ")}
      data-current-sheet={currentSheet}
    >
      {showNavigation && (
        <div className="book-core__fixed-header">
          <BookHeader
            {...headerProps}
            onEdit={onEdit}
            onRestart={onRestart}
          />

          <BookProgress
            currentSheet={currentSheet}
          />
        </div>
      )}

      <div className="book-core__sheet">
        <BookFlip
          direction={direction}
          transitionKey={transitionKey}
        >
          {children}
        </BookFlip>
      </div>

      {showNavigation && (
        <div className="book-core__fixed-footer">
          <BookFooter
            currentSheet={currentSheet}
            canGoBack={canGoBack}
            onBack={onBack}
            onRestart={onRestart}
          />
        </div>
      )}
    </div>
  );
}