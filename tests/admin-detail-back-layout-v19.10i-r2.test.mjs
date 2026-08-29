import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync("src/admin/AdminWorkspace.css", "utf8").replace(/\r\n/g, "\n");

function between(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `marcador inicial ausente: ${startMarker}`);
  assert.ok(end > start, `marcador final ausente: ${endMarker}`);
  return text.slice(start, end);
}

test("V19.10I-R2 coloca o retorno desktop em linha propria antes do eyebrow", () => {
  const block = between(
    css,
    "/* V19.10I_DESKTOP_BACK_REFINEMENT: remove the heavy pill from V19.10H */",
    "/* V19.10I_MOBILE_BACK_CLEARANCE: keep action above browser/safe-area chrome */",
  );

  assert.match(block, /V19\.10I_R2_DESKTOP_BACK_FLOW/);
  assert.match(
    block,
    /\.rf-admin-detail__back\s*\{[^}]*display:\s*flex;[^}]*width:\s*fit-content;/s,
  );
  assert.doesNotMatch(
    block,
    /V19\.10I_R2_DESKTOP_BACK_FLOW[\s\S]*?\.rf-admin-detail__back\s*\{[^}]*display:\s*inline-flex;/,
  );
});

test("V19.10I-R2 preserva o clearance mobile aprovado para novo smoke", () => {
  const mobileStart = css.indexOf("/* V19.10I_MOBILE_BACK_CLEARANCE: keep action above browser/safe-area chrome */");
  assert.ok(mobileStart >= 0);
  const mobile = css.slice(mobileStart);
  assert.match(
    mobile,
    /\.rf-admin-detail__back\s*\{[^}]*bottom:\s*calc\(86px \+ env\(safe-area-inset-bottom\)\);/s,
  );
});
