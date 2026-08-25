import { useState } from "react";
import "./AdminLogin.css";

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [credential, setCredential] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setMessage(
      "A entrada administrativa visual está pronta. A ativação de credenciais reais será feita em uma etapa segura posterior.",
    );
  }

  return (
    <main className="rf-admin-login">
      <section className="rf-admin-login__card" aria-labelledby="admin-login-title">
        <div className="rf-admin-login__brand" aria-hidden="true">RF</div>

        <p className="rf-admin-login__eyebrow">Roda Festa</p>
        <h1 id="admin-login-title">Área administrativa</h1>
        <p className="rf-admin-login__intro">
          Entre para acompanhar planejamentos e, nas próximas etapas, atender cada evento com o histórico completo da jornada.
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
            />
          </label>

          <button type="submit">Entrar</button>
        </form>

        {message ? (
          <p className="rf-admin-login__notice" role="status">{message}</p>
        ) : null}

        <p className="rf-admin-login__security">
          Esta etapa não contém usuário, senha ou segredo fixo no código.
        </p>
      </section>
    </main>
  );
}
