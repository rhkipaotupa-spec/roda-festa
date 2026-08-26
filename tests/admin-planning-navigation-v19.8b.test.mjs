import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const login = fs.readFileSync("src/admin/AdminLogin.jsx", "utf8");
const loginCss = fs.readFileSync("src/admin/AdminLogin.css", "utf8");
const workspaceCss = fs.readFileSync("src/admin/AdminWorkspace.css", "utf8");
const planner = fs.readFileSync("src/planner/planning-book/PlanningBook.jsx", "utf8");
const plannerCss = fs.readFileSync("src/planner/planning-book/PlanningBook.css", "utf8");

test("restauracao de sessao usa shell neutro antes do formulario", () => {
  assert.match(login, /if \(isChecking\)/);
  assert.match(login, /rf-admin-session-check/);
  assert.match(login, /Verificando sessão segura/);
  assert.match(loginCss, /\.rf-admin-session-check/);
});

test("admin aprovado usa marrom escuro como identidade principal", () => {
  assert.match(loginCss, /#432716/);
  assert.match(loginCss, /#24130b/);
  assert.match(workspaceCss, /#432716/);
  assert.match(workspaceCss, /#24130b/);
  assert.doesNotMatch(workspaceCss.split("/* V19.8B APPROVED BROWN THEME */")[1], /#741f25|#641d22/);
});

test("planning reconhece contexto admin e oferece retorno seguro", () => {
  assert.match(planner, /params\.get\("admin"\) !== "1"/);
  assert.match(planner, /requestedReturn\.startsWith\("\/"\)/);
  assert.match(planner, /!requestedReturn\.startsWith\("\/\/"\)/);
  assert.match(planner, /Modo administrativo/);
  assert.match(planner, /Voltar ao Admin/);
  assert.match(planner, /href=\{adminNavigation\.returnTo\}/);
});

test("barra administrativa do planning e responsiva", () => {
  assert.match(plannerCss, /\.rf-admin-mode-bar/);
  assert.match(plannerCss, /position:\s*fixed/);
  assert.match(plannerCss, /@media \(max-width:\s*620px\)/);
});
