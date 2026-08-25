import test from "node:test";
import assert from "node:assert/strict";
import { compareRecommendationToFinal } from "../src/planner/planning-book/engine/planningHistory.js";

test("historico identifica aumento, remocao e inclusao de item", () => {
  const recommendation = {
    items: [
      { id: "coxinha", quantity: 100 },
      { id: "pastel", quantity: 50 },
    ],
  };
  const finalItems = [
    { id: "coxinha", quantity: 150 },
    { id: "hotdog", quantity: 40 },
  ];

  assert.deepEqual(compareRecommendationToFinal(recommendation, finalItems), [
    { type: "ITEM_QUANTITY_CHANGED", productId: "coxinha", before: 100, after: 150 },
    { type: "ITEM_REMOVED", productId: "pastel", before: 50, after: 0 },
    { type: "ITEM_ADDED", productId: "hotdog", before: 0, after: 40 },
  ]);
});
