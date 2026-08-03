import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./SmartNumberInput.css";

const HOLD_DELAY = 550;
const HOLD_INTERVAL = 90;

export default function SmartNumberInput({
  value = 0,
  min = 0,
  max = 500,
  step = 1,
  onChange,
  ariaLabel = "Quantidade",
}) {
  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    draftValue,
    setDraftValue,
  ] = useState(String(value));

  const inputRef = useRef(null);
  const holdTimeoutRef = useRef(null);
  const holdIntervalRef = useRef(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(String(value));
    }
  }, [value, isEditing]);

  useEffect(() => {
    return () => {
      stopHolding();
    };
  }, []);

  function clamp(nextValue) {
    return Math.min(
      max,
      Math.max(min, nextValue)
    );
  }

  function updateValue(nextValue) {
    const normalizedValue = clamp(nextValue);

    onChange?.(normalizedValue);
  }

  function decrease() {
    updateValue(value - step);
  }

  function increase() {
    updateValue(value + step);
  }

  function startHolding(action) {
    action();

    holdTimeoutRef.current =
      window.setTimeout(() => {
        holdIntervalRef.current =
          window.setInterval(() => {
            action();
          }, HOLD_INTERVAL);
      }, HOLD_DELAY);
  }

  function stopHolding() {
    if (holdTimeoutRef.current) {
      window.clearTimeout(
        holdTimeoutRef.current
      );

      holdTimeoutRef.current = null;
    }

    if (holdIntervalRef.current) {
      window.clearInterval(
        holdIntervalRef.current
      );

      holdIntervalRef.current = null;
    }
  }

  function startEditing() {
    setIsEditing(true);

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  function confirmEditing() {
    const parsedValue = Number(draftValue);

    if (Number.isNaN(parsedValue)) {
      setDraftValue(String(value));
      setIsEditing(false);
      return;
    }

    updateValue(parsedValue);
    setIsEditing(false);
  }

  function cancelEditing() {
    setDraftValue(String(value));
    setIsEditing(false);
  }

  function handleInputKeyDown(event) {
    if (event.key === "Enter") {
      confirmEditing();
    }

    if (event.key === "Escape") {
      cancelEditing();
    }
  }

  const decreaseDisabled = value <= min;
  const increaseDisabled = value >= max;

  return (
    <div
      className="smart-number-input"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="smart-number-input__button"
        disabled={decreaseDisabled}
        aria-label={`Diminuir ${ariaLabel}`}
        onPointerDown={() => {
          if (!decreaseDisabled) {
            startHolding(decrease);
          }
        }}
        onPointerUp={stopHolding}
        onPointerLeave={stopHolding}
        onPointerCancel={stopHolding}
      >
        −
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          className="smart-number-input__field"
          type="number"
          min={min}
          max={max}
          step={step}
          inputMode="numeric"
          value={draftValue}
          onChange={(event) =>
            setDraftValue(event.target.value)
          }
          onBlur={confirmEditing}
          onKeyDown={handleInputKeyDown}
          aria-label={ariaLabel}
        />
      ) : (
        <button
          type="button"
          className="smart-number-input__value"
          onClick={startEditing}
          aria-label={`Editar ${ariaLabel}`}
        >
          {value}
        </button>
      )}

      <button
        type="button"
        className="smart-number-input__button"
        disabled={increaseDisabled}
        aria-label={`Aumentar ${ariaLabel}`}
        onPointerDown={() => {
          if (!increaseDisabled) {
            startHolding(increase);
          }
        }}
        onPointerUp={stopHolding}
        onPointerLeave={stopHolding}
        onPointerCancel={stopHolding}
      >
        +
      </button>
    </div>
  );
}