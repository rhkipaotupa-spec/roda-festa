import { useEffect, useState } from "react";
import "./AdminLogin.css";
import "./AdminCommercial.css";

import AdminWorkspace from "./AdminWorkspace.jsx";
import rodaFestaLogo from "../planner/planning-book/assets/logo-roda-festa.png";
import rodaFestaLogoCreme from "../planner/planning-book/assets/logo-roda-festa-creme.png";

const LOGIN_ENDPOINT = "/api/admin-login";
const LOGOUT_ENDPOINT = "/api/admin-logout";
const SESSION_ENDPOINT = "/api/admin-session";
const GENERIC_LOGIN_ERROR = "Não foi possível entrar. Confira seus dados e tente novamente.";
const GENERIC_SESSION_ERROR = "Não foi possível verificar sua sessão agora. Tente novamente em instantes.";
const GENERIC_LOGOUT_ERROR = "Não foi possível sair agora. Sua sessão continua ativa; tente novamente.";

function AuthenticatedAdminView({
  view,
  sessionId,
  sessionMessage,
  operator,
  onLogout,
  isLoggingOut,
  logoutError,
}) {
  const sectionByView = {
    workspace: "quotes",
    products: "products",
    "quote-edit-index": "quotes",
    "quote-edit": "quotes",
  };

  return (
    <AdminWorkspace
      initialSection={sectionByView[view] || "quotes"}
      editSessionId={view === "quote-edit" ? sessionId : ""}
      sessionMessage={sessionMessage}
      operator={operator}
      onLogout={onLogout}
      isLoggingOut={isLoggingOut}
      logoutError={logoutError}
    />
  );
}

export default function AdminLogin({ view = "workspace", sessionId = "" }) {
  const [identifier, setIdentifier] = useState("");
  const [credential, setCredential] = useState("");
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");
  const [operator, setOperator] = useState(null);
  const [logoutStatus, setLogoutStatus] = useState("idle");

  const isChecking = status === "checking";
  const isSubmitting = status === "submitting";
  const isAuthenticated = status === "authenticated";
  const isLoggingOut = logoutStatus === "submitting";

  async function readSession() {
    const response = await fetch(SESSION_ENDPOINT, {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const payload = await response.json().catch(() => null);
    return { response, payload };
  }

  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      try {
        const { response, payload } = await readSession();
        if (cancelled) return;
        if (!response.ok || payload?.ok !== true) {
          setStatus("error");
          setMessage(GENERIC_SESSION_ERROR);
          return;
        }
        if (payload.authenticated === true) {
          setOperator(payload.operator || null);
          setStatus("authenticated");
          setMessage("Sessão administrativa restaurada com segurança.");
          return;
        }
        setStatus("idle");
        setMessage("");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage(GENERIC_SESSION_ERROR);
      }
    }
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isChecking || isSubmitting || isAuthenticated) return;
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ identifier, credential }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) {
        setStatus("error");
        setMessage(GENERIC_LOGIN_ERROR);
        return;
      }

      let authenticatedOperator = null;
      try {
        const sessionResult = await readSession();
        if (sessionResult.response.ok
            && sessionResult.payload?.ok === true
            && sessionResult.payload?.authenticated === true) {
          authenticatedOperator = sessionResult.payload.operator || null;
        }
      } catch {
        // A identidade visual pode usar fallback sem invalidar o login confirmado.
      }

      setCredential("");
      setOperator(authenticatedOperator);
      setLogoutStatus("idle");
      setStatus("authenticated");
      setMessage("Acesso autenticado com sucesso. Sua sessão administrativa foi criada.");
    } catch {
      setStatus("error");
      setMessage(GENERIC_LOGIN_ERROR);
    }
  }

  async function handleLogout() {
    if (!isAuthenticated || isLoggingOut) return;
    setLogoutStatus("submitting");
    try {
      const response = await fetch(LOGOUT_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true) {
        setLogoutStatus("error");
        return;
      }
      setCredential("");
      setIdentifier("");
      setOperator(null);
      setMessage("");
      setLogoutStatus("idle");
      setStatus("idle");
    } catch {
      setLogoutStatus("error");
    }
  }

  if (isChecking) {
    return (
      <main className="rf-admin-session-check" role="status" aria-live="polite">
        <div className="rf-admin-session-check__panel">
          <img src={rodaFestaLogoCreme} alt="Roda Festa" />
          <span>Área administrativa</span>
          <strong>Verificando sessão segura...</strong>
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <AuthenticatedAdminView
        view={view}
        sessionId={sessionId}
        sessionMessage={message}
        operator={operator}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        logoutError={logoutStatus === "error" ? GENERIC_LOGOUT_ERROR : ""}
      />
    );
  }

  return (
    <main className="rf-admin-login">
      <section className="rf-admin-login__story" aria-hidden="true">
        <div className="rf-admin-login__texture" />
        <div className="rf-admin-login__story-inner">
          <img src={rodaFestaLogoCreme} alt="" />
          <span className="rf-admin-login__eyebrow">Roda Festa</span>
          <h1>O cuidado de cada festa continua aqui.</h1>
          <p>Acompanhe sugestões, revisões e versões validadas em um ambiente pensado para o atendimento diário.</p>
          <div className="rf-admin-login__story-note">
            <strong>Sugestão → revisão → validação</strong>
            <small>Cada mudança preserva contexto para melhorar decisões futuras.</small>
          </div>
        </div>
      </section>

      <section className="rf-admin-login__access" aria-labelledby="admin-login-title">
        <div className="rf-admin-login__access-inner">
          <img className="rf-admin-login__logo-mobile" src={rodaFestaLogo} alt="Roda Festa" />
          <span className="rf-admin-login__eyebrow">Área administrativa</span>
          <h2 id="admin-login-title">Bem-vinda de volta.</h2>
          <p className="rf-admin-login__intro">Entre para cuidar dos orçamentos e acompanhar a jornada de cada cliente.</p>

          <form className="rf-admin-login__form" onSubmit={handleSubmit}>
            <label>E-mail<input type="email" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="seu@email.com" required disabled={isSubmitting} /></label>
            <label>Senha<input type="password" autoComplete="current-password" value={credential} onChange={(event) => setCredential(event.target.value)} placeholder="Sua senha" required disabled={isSubmitting} /></label>
            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>{isSubmitting ? "Entrando..." : "Entrar no Admin"}</button>
          </form>

          {message ? <p className="rf-admin-login__notice rf-admin-login__notice--error" role="alert" aria-live="polite">{message}</p> : null}
          <p className="rf-admin-login__security">Sessão protegida por cookie HttpOnly. A senha não fica armazenada pelo Roda Festa no navegador.</p>
        </div>
      </section>
    </main>
  );
}
