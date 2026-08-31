import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function replaceOnce(source, before, after, label) {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`missing_marker:${label}`);
  if (source.indexOf(before, index + before.length) >= 0) {
    throw new Error(`ambiguous_marker:${label}`);
  }
  return source.slice(0, index) + after + source.slice(index + before.length);
}

function patchAdminLogin() {
  const path = "src/admin/AdminLogin.jsx";
  let source = read(path);

  source = replaceOnce(
    source,
    'import AdminWorkspace from "./AdminWorkspace.jsx";\nimport AdminProductsView from "./AdminProductsView.jsx";\nimport AdminQuoteEditIndex from "./AdminQuoteEditIndex.jsx";\nimport AdminQuoteEditView from "./AdminQuoteEditView.jsx";\n',
    'import AdminWorkspace from "./AdminWorkspace.jsx";\n',
    "admin-login-imports",
  );

  const start = source.indexOf("function AdminWorkspaceWithCommercialShortcuts");
  const end = source.indexOf("export default function AdminLogin");
  if (start < 0 || end < 0 || end <= start) throw new Error("missing_marker:admin-login-view-block");

  const replacement = `function AuthenticatedAdminView({\n  view,\n  sessionId,\n  sessionMessage,\n  operator,\n  onLogout,\n  isLoggingOut,\n  logoutError,\n}) {\n  const sectionByView = {\n    workspace: "quotes",\n    products: "products",\n    "quote-edit-index": "orders",\n    "quote-edit": "orders",\n  };\n\n  return (\n    <AdminWorkspace\n      initialSection={sectionByView[view] || "quotes"}\n      editSessionId={view === "quote-edit" ? sessionId : ""}\n      sessionMessage={sessionMessage}\n      operator={operator}\n      onLogout={onLogout}\n      isLoggingOut={isLoggingOut}\n      logoutError={logoutError}\n    />\n  );\n}\n\n`;

  source = source.slice(0, start) + replacement + source.slice(end);
  write(path, source);
}

function patchAdminWorkspace() {
  const path = "src/admin/AdminWorkspace.jsx";
  let source = read(path);

  source = replaceOnce(
    source,
    'import AdminAgendaView from "./AdminAgendaView.jsx";\n',
    'import AdminAgendaView from "./AdminAgendaView.jsx";\nimport AdminProductsView from "./AdminProductsView.jsx";\nimport AdminQuoteEditIndex from "./AdminQuoteEditIndex.jsx";\nimport AdminQuoteEditView from "./AdminQuoteEditView.jsx";\nimport "./AdminCommercialIntegrated.css";\n',
    "workspace-imports",
  );

  source = replaceOnce(
    source,
    `export default function AdminWorkspace({\n  sessionMessage = "",\n  operator = null,\n  onLogout = null,\n  isLoggingOut = false,\n  logoutError = "",\n}) {`,
    `export default function AdminWorkspace({\n  sessionMessage = "",\n  operator = null,\n  onLogout = null,\n  isLoggingOut = false,\n  logoutError = "",\n  initialSection = "quotes",\n  editSessionId = "",\n}) {`,
    "workspace-props",
  );

  source = replaceOnce(
    source,
    'const [activeSection, setActiveSection] = useState("quotes");',
    'const [activeSection, setActiveSection] = useState(initialSection);',
    "workspace-initial-section",
  );

  source = replaceOnce(
    source,
    `  function switchSection(section) {\n    setActiveSection(section);\n    setMobileMenuOpen(false);\n  }`,
    `  function switchSection(section) {\n    setActiveSection(section);\n    setMobileMenuOpen(false);\n  }\n\n  const sectionTitle = {\n    quotes: "Orçamentos",\n    agenda: "Agenda",\n    orders: "Pedidos",\n    products: "Produtos",\n  }[activeSection] || "Admin";`,
    "workspace-section-title",
  );

  const desktopAgenda = `          <button\n            type="button"\n            className={activeSection === "agenda" ? "is-active" : ""}\n            data-admin-section="agenda"\n            aria-label="Agenda"\n            onClick={() => setActiveSection("agenda")}\n          >\n            <span>Agenda</span>\n          </button>\n`;
  const desktopExpanded = `${desktopAgenda}\n          <button\n            type="button"\n            className={activeSection === "orders" ? "is-active" : ""}\n            data-admin-section="orders"\n            aria-label="Pedidos"\n            onClick={() => switchSection("orders")}\n          >\n            <span>Pedidos</span>\n          </button>\n\n          <button\n            type="button"\n            className={activeSection === "products" ? "is-active" : ""}\n            data-admin-section="products"\n            aria-label="Produtos"\n            onClick={() => switchSection("products")}\n          >\n            <span>Produtos</span>\n          </button>\n`;
  source = replaceOnce(source, desktopAgenda, desktopExpanded, "workspace-desktop-nav");

  const mobileAgenda = `              <button\n                type="button"\n                className={activeSection === "agenda" ? "is-active" : ""}\n                onClick={() => switchSection("agenda")}\n              >\n                <span>Agenda</span>\n                <small>Datas e eventos</small>\n              </button>\n`;
  const mobileExpanded = `${mobileAgenda}              <button\n                type="button"\n                className={activeSection === "orders" ? "is-active" : ""}\n                onClick={() => switchSection("orders")}\n              >\n                <span>Pedidos</span>\n                <small>Revisões comerciais</small>\n              </button>\n              <button\n                type="button"\n                className={activeSection === "products" ? "is-active" : ""}\n                onClick={() => switchSection("products")}\n              >\n                <span>Produtos</span>\n                <small>Catálogo, preços e capacidades</small>\n              </button>\n`;
  source = replaceOnce(source, mobileAgenda, mobileExpanded, "workspace-mobile-nav");

  source = replaceOnce(
    source,
    '<h1>{activeSection === "agenda" ? "Agenda" : "Orçamentos"}</h1>',
    '<h1>{sectionTitle}</h1>',
    "workspace-topbar-title",
  );

  source = replaceOnce(
    source,
    `        ) : (\n          <AdminAgendaView onOpenQuote={openQuote} />\n        )}`,
    `        ) : activeSection === "agenda" ? (\n          <AdminAgendaView onOpenQuote={openQuote} />\n        ) : activeSection === "products" ? (\n          <AdminProductsView embedded />\n        ) : editSessionId ? (\n          <AdminQuoteEditView sessionId={editSessionId} embedded />\n        ) : (\n          <AdminQuoteEditIndex embedded />\n        )}`,
    "workspace-section-render",
  );

  write(path, source);
}

function patchProducts() {
  const path = "src/admin/AdminProductsView.jsx";
  let source = read(path);

  source = replaceOnce(
    source,
    "export default function AdminProductsView() {",
    "export default function AdminProductsView({ embedded = false } = {}) {",
    "products-props",
  );
  source = replaceOnce(
    source,
    '  const [saving, setSaving] = useState(false);',
    '  const [saving, setSaving] = useState(false);\n  const [editorOpen, setEditorOpen] = useState(false);',
    "products-editor-state",
  );
  source = replaceOnce(
    source,
    `  function newProduct() {\n    setDraft(emptyDraft());\n    setEditingExisting(false);\n    setMessage("");\n  }`,
    `  function newProduct() {\n    setDraft(emptyDraft());\n    setEditingExisting(false);\n    setMessage("");\n    setEditorOpen(true);\n  }`,
    "products-new",
  );
  source = replaceOnce(
    source,
    `  function editProduct(product) {\n    setDraft(draftFromProduct(product));\n    setEditingExisting(true);\n    setMessage("");\n  }`,
    `  function editProduct(product) {\n    setDraft(draftFromProduct(product));\n    setEditingExisting(true);\n    setMessage("");\n    setEditorOpen(true);\n  }`,
    "products-edit",
  );
  source = replaceOnce(
    source,
    `      setMessage(\`Produto salvo. Revisão \${payload.revision}.\`);\n      setDraft(draftFromProduct(payload.product));\n      setEditingExisting(true);\n      await loadProducts();`,
    `      setMessage(\`Produto salvo. Revisão \${payload.revision}.\`);\n      setDraft(draftFromProduct(payload.product));\n      setEditingExisting(true);\n      setEditorOpen(false);\n      await loadProducts();`,
    "products-save-close",
  );
  source = replaceOnce(
    source,
    '<main className="rf-commercial-page">',
    '<section className={embedded ? "rf-commercial-page rf-commercial-page--embedded" : "rf-commercial-page"}>',
    "products-root-open",
  );
  source = replaceOnce(source, "</main>\n  );\n}", "</section>\n  );\n}", "products-root-close");
  source = replaceOnce(
    source,
    `        <div className="rf-commercial-header__actions">\n          <a href="/admin">Voltar ao Admin</a>\n          <a href="/admin/editar-pedido">Editar pedido</a>\n          <button type="button" onClick={newProduct}>+ Cadastrar produto</button>\n        </div>`,
    `        <div className="rf-commercial-header__actions">\n          {!embedded ? <a href="/admin">Voltar ao Admin</a> : null}\n          {!embedded ? <a href="/admin/editar-pedido">Pedidos</a> : null}\n          <button type="button" onClick={newProduct}>+ Cadastrar produto</button>\n        </div>`,
    "products-header-actions",
  );
  source = replaceOnce(
    source,
    '<section className="rf-commercial-editor">',
    `{embedded && editorOpen ? (\n          <button\n            type="button"\n            className="rf-commercial-drawer-backdrop"\n            aria-label="Fechar editor de produto"\n            onClick={() => setEditorOpen(false)}\n          />\n        ) : null}\n\n        <section className={\`rf-commercial-editor \${embedded && editorOpen ? "is-open" : ""}\`}>`,
    "products-editor-shell",
  );
  source = replaceOnce(
    source,
    `          <div className="rf-commercial-editor__heading">\n            <span>{editingExisting ? "Editar produto" : "Novo produto"}</span>`,
    `          <div className="rf-commercial-editor__heading">\n            {embedded ? <button type="button" className="rf-commercial-drawer-close" onClick={() => setEditorOpen(false)} aria-label="Fechar editor">×</button> : null}\n            <span>{editingExisting ? "Editar produto" : "Novo produto"}</span>`,
    "products-editor-close",
  );

  write(path, source);
}

function patchQuoteIndex() {
  const path = "src/admin/AdminQuoteEditIndex.jsx";
  let source = read(path);
  source = replaceOnce(source, "export default function AdminQuoteEditIndex() {", "export default function AdminQuoteEditIndex({ embedded = false } = {}) {", "quote-index-props");
  source = replaceOnce(source, '<main className="rf-commercial-page">', '<section className={embedded ? "rf-commercial-page rf-commercial-page--embedded" : "rf-commercial-page"}>', "quote-index-root-open");
  source = replaceOnce(source, "</main>\n  );\n}", "</section>\n  );\n}", "quote-index-root-close");
  source = replaceOnce(
    source,
    '<h1>Editar pedido</h1>\n          <p>Escolha uma proposta já validada. A versão original fica preservada e cada salvamento cria uma nova revisão administrativa.</p>',
    '<h1>{embedded ? "Pedidos validados" : "Editar pedido"}</h1>\n          <p>Escolha uma proposta já validada. A versão original fica preservada e cada salvamento cria uma nova revisão administrativa.</p>',
    "quote-index-title",
  );
  source = replaceOnce(
    source,
    `        <div className="rf-commercial-header__actions">\n          <a href="/admin">Voltar ao Admin</a>\n          <a href="/admin/produtos">Produtos</a>\n        </div>`,
    `        {!embedded ? (\n          <div className="rf-commercial-header__actions">\n            <a href="/admin">Voltar ao Admin</a>\n            <a href="/admin/produtos">Produtos</a>\n          </div>\n        ) : null}`,
    "quote-index-actions",
  );
  write(path, source);
}

function patchQuoteEdit() {
  const path = "src/admin/AdminQuoteEditView.jsx";
  let source = read(path);
  source = replaceOnce(source, "export default function AdminQuoteEditView({ sessionId }) {", "export default function AdminQuoteEditView({ sessionId, embedded = false }) {", "quote-edit-props");
  source = replaceOnce(source, 'if (status === "loading") return <main className="rf-commercial-page"><p>Carregando pedido...</p></main>;', 'if (status === "loading") return <section className={embedded ? "rf-commercial-page rf-commercial-page--embedded" : "rf-commercial-page"}><p>Carregando pedido...</p></section>;', "quote-edit-loading");
  source = replaceOnce(source, 'if (status === "error") return <main className="rf-commercial-page"><a href="/admin">Voltar ao Admin</a><p>{message}</p></main>;', 'if (status === "error") return <section className={embedded ? "rf-commercial-page rf-commercial-page--embedded" : "rf-commercial-page"}>{!embedded ? <a href="/admin">Voltar ao Admin</a> : null}<p>{message}</p></section>;', "quote-edit-error");
  source = replaceOnce(source, 'if (status === "requires-final") return <main className="rf-commercial-page"><a href="/admin">Voltar ao Admin</a><h1>Este orçamento ainda não tem proposta final.</h1><p>A edição administrativa comercial fica disponível depois da primeira finalização.</p></main>;', 'if (status === "requires-final") return <section className={embedded ? "rf-commercial-page rf-commercial-page--embedded" : "rf-commercial-page"}>{!embedded ? <a href="/admin">Voltar ao Admin</a> : null}<h1>Este orçamento ainda não tem proposta final.</h1><p>A edição administrativa comercial fica disponível depois da primeira finalização.</p></section>;', "quote-edit-requires-final");
  source = replaceOnce(source, '<main className="rf-commercial-page">', '<section className={embedded ? "rf-commercial-page rf-commercial-page--embedded" : "rf-commercial-page"}>', "quote-edit-root-open");
  source = replaceOnce(source, "</main>\n  );\n}", "</section>\n  );\n}", "quote-edit-root-close");
  source = replaceOnce(
    source,
    `        <div className="rf-commercial-header__actions"><a href="/admin">Voltar ao Admin</a></div>`,
    `        <div className="rf-commercial-header__actions">\n          <a href={embedded ? "/admin/editar-pedido" : "/admin"}>{embedded ? "← Voltar para pedidos" : "Voltar ao Admin"}</a>\n        </div>`,
    "quote-edit-actions",
  );
  write(path, source);
}

function writeIntegratedCss() {
  write("src/admin/AdminCommercialIntegrated.css", `
.rf-commercial-page--embedded {
  min-height: 0;
  padding: 28px 0 0;
  background: transparent;
}

.rf-commercial-page--embedded .rf-commercial-header,
.rf-commercial-page--embedded .rf-commercial-grid,
.rf-commercial-page--embedded .rf-commercial-notice,
.rf-commercial-page--embedded > .rf-commercial-list {
  max-width: none;
}

.rf-commercial-page--embedded .rf-commercial-header {
  align-items: center;
  margin-bottom: 20px;
  padding: 0 2px;
}

.rf-commercial-page--embedded .rf-commercial-header h1 {
  margin-top: 4px;
  font-size: clamp(28px, 3vw, 40px);
  color: var(--rf-admin-ink);
}

.rf-commercial-page--embedded .rf-commercial-header p {
  max-width: 760px;
  line-height: 1.55;
}

.rf-commercial-page--embedded .rf-commercial-header__actions button {
  min-height: 46px;
  border-radius: 14px;
  border-color: var(--rf-admin-wine);
  background: linear-gradient(135deg, #741f25, #54151a);
  box-shadow: 0 10px 24px rgba(91, 24, 28, .14);
}

.rf-commercial-page--embedded .rf-commercial-grid {
  grid-template-columns: minmax(0, 1fr);
}

.rf-commercial-page--embedded .rf-commercial-list {
  border-color: var(--rf-admin-line);
  background: rgba(255, 251, 244, .78);
  box-shadow: 0 14px 34px rgba(82, 48, 31, .06);
}

.rf-commercial-page--embedded .rf-product-row {
  min-height: 70px;
}

.rf-commercial-page--embedded .rf-commercial-editor {
  display: none;
}

.rf-commercial-page--embedded .rf-commercial-editor.is-open {
  position: fixed;
  z-index: 92;
  top: 0;
  right: 0;
  bottom: 0;
  display: block;
  width: min(520px, 92vw);
  overflow-y: auto;
  border: 0;
  border-left: 1px solid rgba(117, 75, 49, .18);
  border-radius: 0;
  padding: 30px 28px 40px;
  background: #fffaf1;
  box-shadow: -20px 0 60px rgba(53, 27, 18, .22);
}

.rf-commercial-drawer-backdrop {
  position: fixed;
  z-index: 91;
  inset: 0;
  border: 0;
  background: rgba(42, 20, 14, .42);
  backdrop-filter: blur(2px);
}

.rf-commercial-drawer-close {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 38px;
  height: 38px;
  border: 1px solid #d8c0a1;
  border-radius: 12px;
  background: #fff7ea;
  color: #5c3b2d;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.rf-commercial-page--embedded .rf-commercial-editor__heading {
  position: relative;
  padding-right: 42px;
}

.rf-commercial-page--embedded .rf-commercial-editor__heading h2 {
  font-size: 30px;
}

.rf-admin-nav button[data-admin-section="orders"],
.rf-admin-nav button[data-admin-section="products"] {
  cursor: pointer;
}

@media (max-width: 900px) {
  .rf-commercial-page--embedded {
    padding-top: 18px;
  }

  .rf-commercial-page--embedded .rf-commercial-header {
    display: grid;
    gap: 16px;
  }

  .rf-commercial-page--embedded .rf-commercial-header__actions,
  .rf-commercial-page--embedded .rf-commercial-header__actions button {
    width: 100%;
  }

  .rf-commercial-page--embedded .rf-commercial-editor.is-open {
    width: min(560px, 100vw);
  }
}

@media (max-width: 560px) {
  .rf-commercial-page--embedded .rf-commercial-header h1 {
    font-size: 30px;
  }

  .rf-commercial-page--embedded .rf-commercial-list {
    padding: 14px;
  }

  .rf-commercial-page--embedded .rf-commercial-editor.is-open {
    padding: 24px 16px 32px;
  }
}
`);
}

function writeUxTest() {
  write("tests/admin-commercial-v1-ux-integration.test.mjs", `import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs";\n\nfunction source(path) { return fs.readFileSync(path, "utf8"); }\n\ntest("Admin integra Pedidos e Produtos no shell principal", () => {\n  const workspace = source("src/admin/AdminWorkspace.jsx");\n  const login = source("src/admin/AdminLogin.jsx");\n  assert.match(workspace, /data-admin-section="orders"/);\n  assert.match(workspace, /data-admin-section="products"/);\n  assert.match(workspace, /<AdminProductsView embedded \/>/);\n  assert.match(workspace, /<AdminQuoteEditIndex embedded \/>/);\n  assert.match(login, /products: "products"/);\n  assert.match(login, /"quote-edit-index": "orders"/);\n  assert.doesNotMatch(login, /rf-admin-commercial-shortcuts/);\n});\n\ntest("Produtos usa editor em drawer no shell integrado", () => {\n  const products = source("src/admin/AdminProductsView.jsx");\n  const css = source("src/admin/AdminCommercialIntegrated.css");\n  assert.match(products, /editorOpen/);\n  assert.match(products, /rf-commercial-drawer-backdrop/);\n  assert.match(products, /setEditorOpen\(true\)/);\n  assert.match(css, /rf-commercial-editor\.is-open/);\n});\n`);
}

patchAdminLogin();
patchAdminWorkspace();
patchProducts();
patchQuoteIndex();
patchQuoteEdit();
writeIntegratedCss();
writeUxTest();

console.log("[GREEN] Admin Commercial UX V2 aplicado no working tree.");
