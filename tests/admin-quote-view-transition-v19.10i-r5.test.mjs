import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workspace = await readFile(
  new URL("../src/admin/AdminWorkspace.jsx", import.meta.url),
  "utf8",
);

test("V19.10I-R5 troca views sem setState sincrono no corpo do effect", () => {
  assert.doesNotMatch(
    workspace,
    /useEffect\(\(\) => \{\s*let cancelled = false;\s*setStatus\("loading"\)/,
  );

  assert.match(
    workspace,
    /function switchQuoteView\(nextView\) \{[\s\S]*?setStatus\("loading"\);[\s\S]*?setError\(""\);[\s\S]*?setSearch\(""\);[\s\S]*?setOperationMessage\(""\);[\s\S]*?setQuoteView\(nextView\);[\s\S]*?\}/,
  );
});

test("V19.10I-R5 Ativos Arquivados e Lixeira usam a transicao explicita", () => {
  assert.match(workspace, /switchQuoteView\("ACTIVE"\)/);
  assert.match(workspace, /switchQuoteView\("ARCHIVED"\)/);
  assert.match(workspace, /switchQuoteView\("TRASHED"\)/);
  assert.match(workspace, /useEffect\([\s\S]*?\}, \[quoteView\]\);/);
});
