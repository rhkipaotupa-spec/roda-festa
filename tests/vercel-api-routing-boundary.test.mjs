import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const config = JSON.parse(
  await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
);

test("vercel preserva namespace api antes do fallback SPA", () => {
  assert.ok(Array.isArray(config.rewrites));
  assert.ok(config.rewrites.length >= 2);

  assert.deepEqual(config.rewrites[0], {
    source: "/api/(.*)",
    destination: "/api/$1",
  });

  assert.deepEqual(config.rewrites[1], {
    source: "/(.*)",
    destination: "/index.html",
  });
});

test("fallback SPA nao substitui explicitamente a rota api", () => {
  const apiRuleIndex = config.rewrites.findIndex(
    (rule) => rule.source === "/api/(.*)",
  );
  const spaFallbackIndex = config.rewrites.findIndex(
    (rule) => rule.source === "/(.*)"
      && rule.destination === "/index.html",
  );

  assert.notEqual(apiRuleIndex, -1);
  assert.notEqual(spaFallbackIndex, -1);
  assert.ok(apiRuleIndex < spaFallbackIndex);
});

test("configuracao nao usa builds ou routes legados", () => {
  assert.equal("builds" in config, false);
  assert.equal("routes" in config, false);
});
