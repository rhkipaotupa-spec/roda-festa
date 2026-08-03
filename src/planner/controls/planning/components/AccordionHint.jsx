import {
  useId,
  useState,
} from "react";

import "./AccordionHint.css";

export default function AccordionHint({
  label = "Entender o motivo",
  children,
  defaultOpen = false,
}) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(defaultOpen);

  const contentId = useId();

  function toggleAccordion() {
    setIsOpen(
      (currentState) => !currentState
    );
  }

  return (
    <div
      className={[
        "accordion-hint",
        isOpen
          ? "accordion-hint--open"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="accordion-hint__trigger"
        onClick={toggleAccordion}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="accordion-hint__label">
          {label}
        </span>

        <span
          className="accordion-hint__indicator"
          aria-hidden="true"
        >
          <span />
          <span />
        </span>
      </button>

      <div
        id={contentId}
        className="accordion-hint__content"
        hidden={!isOpen}
      >
        <div className="accordion-hint__content-inner">
          {children}
        </div>
      </div>
    </div>
  );
}