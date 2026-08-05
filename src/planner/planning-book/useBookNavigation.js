import {
  useCallback,
  useMemo,
  useState,
} from "react";

export const BOOK_SHEETS = {
  BRIEFING: "briefing",
  SUGGESTION: "suggestion",
  STATION: "station",
  CUSTOMIZATION: "customization",
  SUMMARY: "summary",
};

export const BOOK_SHEET_ORDER = [
  BOOK_SHEETS.BRIEFING,
  BOOK_SHEETS.SUGGESTION,
  BOOK_SHEETS.STATION,
  BOOK_SHEETS.CUSTOMIZATION,
  BOOK_SHEETS.SUMMARY,
];

const VALID_SHEETS = new Set(
  BOOK_SHEET_ORDER
);

function isValidSheet(sheet) {
  return VALID_SHEETS.has(sheet);
}

function getSheetIndex(sheet) {
  const index =
    BOOK_SHEET_ORDER.indexOf(sheet);

  return index >= 0 ? index : 0;
}

export default function useBookNavigation({
  initialSheet = BOOK_SHEETS.BRIEFING,
  onRestart,
} = {}) {
  const safeInitialSheet =
    isValidSheet(initialSheet)
      ? initialSheet
      : BOOK_SHEETS.BRIEFING;

  const [
    currentSheet,
    setCurrentSheet,
  ] = useState(safeInitialSheet);

  const [
    history,
    setHistory,
  ] = useState([]);

  const [
    direction,
    setDirection,
  ] = useState("forward");

  const [
    selectedStation,
    setSelectedStation,
  ] = useState(null);

  const [
    transitionKey,
    setTransitionKey,
  ] = useState(0);

  const currentSheetIndex =
    getSheetIndex(currentSheet);

  const currentStep =
    currentSheetIndex + 1;

  const totalSteps =
    BOOK_SHEET_ORDER.length;

  const progress =
    totalSteps > 1
      ? currentSheetIndex /
        (totalSteps - 1)
      : 0;

  const canGoBack =
    history.length > 0;

  const goTo = useCallback(
    (
      nextSheet,
      {
        station = null,
        replace = false,
        direction:
          nextDirection = "forward",
      } = {}
    ) => {
      if (!isValidSheet(nextSheet)) {
        console.warn(
          `Folha inválida do livro: ${nextSheet}`
        );

        return;
      }

      if (
        nextSheet === currentSheet &&
        station === selectedStation
      ) {
        return;
      }

      setDirection(nextDirection);

      if (!replace) {
        setHistory(
          (currentHistory) => [
            ...currentHistory,
            {
              sheet: currentSheet,
              station:
                selectedStation,
            },
          ]
        );
      }

      if (station !== null) {
        setSelectedStation(station);
      }

      setCurrentSheet(nextSheet);

      setTransitionKey(
        (currentValue) =>
          currentValue + 1
      );
    },
    [
      currentSheet,
      selectedStation,
    ]
  );

  const goBack = useCallback(() => {
    setHistory(
      (currentHistory) => {
        if (
          currentHistory.length === 0
        ) {
          return currentHistory;
        }

        const previousEntry =
          currentHistory[
            currentHistory.length - 1
          ];

        setDirection("backward");

        setCurrentSheet(
          previousEntry.sheet
        );

        setSelectedStation(
          previousEntry.station ??
            null
        );

        setTransitionKey(
          (currentValue) =>
            currentValue + 1
        );

        return currentHistory.slice(
          0,
          -1
        );
      }
    );
  }, []);

  const goToBriefing =
    useCallback(() => {
      if (
        currentSheet ===
        BOOK_SHEETS.BRIEFING
      ) {
        return;
      }

      setDirection("backward");

      setHistory([]);

      setCurrentSheet(
        BOOK_SHEETS.BRIEFING
      );

      setSelectedStation(null);

      setTransitionKey(
        (currentValue) =>
          currentValue + 1
      );
    }, [currentSheet]);

  const goToSuggestion =
    useCallback(() => {
      goTo(
        BOOK_SHEETS.SUGGESTION
      );
    }, [goTo]);

  const goToStation =
    useCallback(
      (station) => {
        if (!station) {
          console.warn(
            "Nenhuma estação foi informada."
          );

          return;
        }

        goTo(
          BOOK_SHEETS.STATION,
          {
            station,
          }
        );
      },
      [goTo]
    );

  const goToCustomization =
    useCallback(
      (station = selectedStation) => {
        if (!station) {
          console.warn(
            "Selecione uma estação antes de personalizar."
          );

          return;
        }

        goTo(
          BOOK_SHEETS.CUSTOMIZATION,
          {
            station,
          }
        );
      },
      [
        goTo,
        selectedStation,
      ]
    );

  const goToSummary =
    useCallback(() => {
      goTo(
        BOOK_SHEETS.SUMMARY
      );
    }, [goTo]);

  const restart =
    useCallback(() => {
      setDirection("backward");

      setHistory([]);

      setCurrentSheet(
        BOOK_SHEETS.BRIEFING
      );

      setSelectedStation(null);

      setTransitionKey(
        (currentValue) =>
          currentValue + 1
      );

      if (
        typeof onRestart ===
        "function"
      ) {
        onRestart();
      }
    }, [onRestart]);

  const sheetMeta =
    useMemo(
      () => ({
        sheet: currentSheet,
        index:
          currentSheetIndex,
        step:
          currentStep,
        total:
          totalSteps,
        progress,
        isFirst:
          currentSheetIndex === 0,
        isLast:
          currentSheetIndex ===
          totalSteps - 1,
      }),
      [
        currentSheet,
        currentSheetIndex,
        currentStep,
        totalSteps,
        progress,
      ]
    );

  return {
    currentSheet,
    currentSheetIndex,
    currentStep,
    totalSteps,
    progress,
    sheetMeta,

    selectedStation,
    setSelectedStation,

    direction,
    transitionKey,

    history,
    canGoBack,

    goTo,
    goBack,
    goToBriefing,
    goToSuggestion,
    goToStation,
    goToCustomization,
    goToSummary,
    restart,
  };
}