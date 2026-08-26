import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync("src/planner/planning-book/PlanningBook.css", "utf8");
const theme = css.split("/* V19.8C APPROVED PLANNING BROWN THEME */")[1] || "";

test("planning usa marrom aprovado como cor primaria", () => {
  assert.match(theme, /--rf-wine:\s*#432716/);
  assert.match(theme, /--rf-wine-deep:\s*#24130b/);
  assert.match(theme, /--rf-wine-soft:\s*#5b3823/);
});

test("welcome e botoes primarios abandonam vinho antigo no override aprovado", () => {
  assert.match(theme, /\.rf-welcome\s*\{/);
  assert.match(theme, /#4c2b19/);
  assert.match(theme, /#351d11/);
  assert.match(theme, /\.rf-primary\s*\{/);
  assert.match(theme, /#2e190f/);
  assert.doesNotMatch(theme, /#741f25|#641d22|#54151a|#3f1216/);
});

test("estados de foco e selecao acompanham a nova identidade", () => {
  assert.match(theme, /rgba\(67,\s*39,\s*22,\s*\.09\)/);
  assert.match(theme, /rgba\(67,\s*39,\s*22,\s*\.11\)/);
});
