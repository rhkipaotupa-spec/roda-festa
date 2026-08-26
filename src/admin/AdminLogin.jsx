import { useState } from "react";
import "./AdminLogin.css";

const LOGIN_ENDPOINT = "/api/admin-login";
const GENERIC_LOGIN_ERROR =
  "Não foi possível entrar. Confira seus dados e tente novamente.";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [credential, setCredential] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const isSubmitting = status === "submitting";
  const isAuthenticated = status === "authenticated";

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting || isAuthenticated) return;

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          identifier,
          credential,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.ok !== true) {
        setStatus("error");
        setMessage(GENERIC_LOGIN_ERROR);
        return;
      }

      setCredential("");
      setStatus("authenticated");
      setMessage(
        "Acesso autenticado com sucesso. Sua sessão administrativa foi criada.",
      );
    } catch {
      setStatus("error");
      setMessage(GENERIC_LOGIN_ERROR);
    }
  }

  return (
    <main className="rf-admin-login">
      <section
        className="rf-admin-login__card"
        aria-labelledby="admin-login-title"
      >
        <div className="rf-admin-login__brand" aria-hidden="true">RF</div>

        <p className="rf-admin-login__eyebrow">Roda Festa</p>
        <h1 id="admin-login-title">Área administrativa</h1>
        <p className="rf-admin-login__intro">
          Entre para acompanhar planejamentos e, nas próximas etapas, atender
          cada evento com o histórico completo da jornada.
        </p>

        <form className="rf-admin-login__form" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="seu@email.com"
              required
              disabled={isSubmitting || isAuthenticated}
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              value={credential}
              onChange={(event) => setCredential(event.target.value)}
              placeholder="Sua senha"
              required
              disabled={isSubmitting || isAuthenticated}
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || isAuthenticated}
            aria-busy={isSubmitting}
          >
            {isSubmitting
              ? "Entrando..."
              : isAuthenticated
                ? "Sessão ativa"
                : "Entrar"}
          </button>
        </form>

        {message ? (
          <p
            className={`rf-admin-login__notice rf-admin-login__notice--${status}`}
            role={status === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {message}
          </p>
        ) : null}

        <p className="rf-admin-login__security">
          Sua senha é enviada somente ao endpoint administrativo seguro e não
          fica armazenada no navegador pelo Roda Festa.
        </p>
      </section>
    </main>
  );
}
