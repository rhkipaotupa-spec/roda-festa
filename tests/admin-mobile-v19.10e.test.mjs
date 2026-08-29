import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function read(path) {
  return fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

const workspaceJsx = read('src/admin/AdminWorkspace.jsx');
const workspaceCss = read('src/admin/AdminWorkspace.css');
const agendaCss = read('src/admin/AdminAgenda.css');
const loginCss = read('src/admin/AdminLogin.css');

test('V19.10E mobile usa drawer no header em vez do seletor Orçamentos/Agenda', () => {
  assert.ok(workspaceJsx.includes('className="rf-admin-mobile-menu-trigger"'));
  assert.ok(workspaceJsx.includes('className="rf-admin-mobile-drawer-layer"'));
  assert.ok(workspaceJsx.includes('className="rf-admin-mobile-drawer__nav"'));
  assert.equal(workspaceJsx.includes('className="rf-admin-mobile-nav"'), false);
});

test('V19.10E identidade do operador sai da topbar mobile e permanece no drawer', () => {
  assert.ok(workspaceCss.includes('.rf-admin-operator-chip {\n    display: none;'));
  assert.ok(workspaceJsx.includes('className="rf-admin-mobile-drawer__operator"'));
  assert.ok(workspaceJsx.includes('<strong>{operatorName}</strong>'));
});

test('V19.10E detalhes oferecem retorno explícito para a tela principal', () => {
  assert.ok(workspaceJsx.includes('className="rf-admin-detail__back"'));
  assert.ok(workspaceJsx.includes('Voltar para {activeSection === "agenda" ? "agenda" : "orçamentos"}'));
  assert.ok(workspaceCss.includes('.rf-admin-detail__back'));
});

test('V19.10E mobile reduz peso editorial de hero, métricas e agenda', () => {
  assert.ok(workspaceCss.includes('.rf-admin-hero p,\n  .rf-admin-hero__ornament {\n    display: none;'));
  assert.ok(workspaceCss.includes('.rf-admin-metrics article + article'));
  assert.ok(agendaCss.includes('.rf-admin-agenda__intro p,\n  .rf-admin-agenda__intro-mark {\n    display: none;'));
  assert.ok(agendaCss.includes('.rf-admin-agenda__metrics article + article'));
});

test('V19.10E login mobile dá contraste real ao logo sem alterar o desktop', () => {
  assert.match(
    loginCss,
    /@media \(max-width: 620px\)[\s\S]*?\.rf-admin-login__logo-mobile \{[\s\S]*?background: linear-gradient\(145deg, #4c2b19 0%, #2b170d 100%\);/,
  );
});
