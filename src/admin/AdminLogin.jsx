import { useEffect, useState } from "react";
import "./AdminLogin.css";

const LOGIN_ENDPOINT = "/api/admin-login";
const SESSION_ENDPOINT = "/api/admin-session";
const GENERIC_LOGIN_ERROR =
  "Não foi possível entrar. Confira seus dados e tente novamente.";
const GENERIC_SESSION_ERROR =
  "Não foi possível verificar sua sessão agora. Tente novamente em instantes.";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [credential, setCredential] = useState("");
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  const isChecking = status === "checking";
  const isSubmitting = status === "submitting";
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await fetch(SESSION_ENDPOINT, {
          method: "GET",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
        });

        const payload = await response.json().catch(() => null);

        if (cancelled) return;

        if (!response.ok || payload?.ok !== true) {
          setStatus("error");
          setMessage(GENERIC_SESSION_ERROR);
          return;
        }

        if (payload.authenticated === true) {
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

    return () => {
      cancelled = true;
    };
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

        {isAuthenticated ? (
          <>
            <p className="rf-admin-login__intro">
              Sua sessão administrativa está ativa neste navegador.
            </p>

            <p
              className="rf-admin-login__notice rf-admin-login__notice--authenticated"
              role="status"
              aria-live="polite"
            >
              {message || "Sessão administrativa ativa."}
            </p>

            <p className="rf-admin-login__security">
              A próxima etapa abrirá a área administrativa protegida sem
              armazenar o token de sessão no JavaScript.
            </p>
          </>
        ) : (
          <>
            <p className="rf-admin-login__intro">
              Entre para acompanhar planejamentos e, nas próximas etapas,
              atender cada evento com o histórico completo da jornada.
            </p>

            {isChecking ? (
              <p
                className="rf-admin-login__notice"
                role="status"
                aria-live="polite"
              >
                Verificando sessão segura...
              </p>
            ) : (
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </button>
              </form>
            )}

            {!isChecking && message ? (
              <p
                className="rf-admin-login__notice rf-admin-login__notice--error"
                role="alert"
                aria-live="polite"
              >
                {message}
              </p>
            ) : null}

            <p className="rf-admin-login__security">
              Sua senha é enviada somente ao endpoint administrativo seguro e
              não fica armazenada no navegador pelo Roda Festa.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
