import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./concierge.css";

const QUICK_PROMPTS = [
  "Como funciona a Roda Festa?",
  "Criança conta na quantidade?",
  "Como funciona a consignação?",
  "Me explique o Brigadeiro no Tacho",
];

function pageContextFromPath(pathname) {
  if (pathname === "/planning-book") return "planning-book";
  if (pathname === "/planner") return "planner";
  return "site-institucional";
}

function shouldHide(pathname) {
  return pathname.startsWith("/admin")
    || pathname === "/planner-sandbox"
    || pathname === "/book-cover"
    || pathname === "/r4-preview";
}

export default function Concierge() {
  const location = useLocation();
  const hidden = shouldHide(location.pathname);
  const pageContext = pageContextFromPath(location.pathname);
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Olá ✨ Eu sou o Concierge Roda Festa. Posso explicar como funciona o serviço, tirar dúvidas sobre o planejamento e te ajudar antes de falar com nossa equipe.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsHuman, setNeedsHuman] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (hidden || open) return undefined;
    const alreadyShown = window.sessionStorage.getItem("rf-concierge-nudge-shown") === "1";
    if (alreadyShown) return undefined;
    const timer = window.setTimeout(() => {
      setShowNudge(true);
      window.sessionStorage.setItem("rf-concierge-nudge-shown", "1");
    }, pageContext === "planning-book" ? 4500 : 7000);
    return () => window.clearTimeout(timer);
  }, [hidden, open, pageContext]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const history = useMemo(
    () => messages.slice(-8).map(({ role, content }) => ({ role, content })),
    [messages],
  );

  if (hidden) return null;

  async function sendMessage(rawText) {
    const text = String(rawText || "").trim();
    if (!text || loading) return;

    const nextUser = { role: "user", content: text };
    setMessages((current) => [...current, nextUser]);
    setInput("");
    setLoading(true);
    setNeedsHuman(false);
    setShowNudge(false);

    try {
      const response = await fetch("/api/concierge", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          message: text,
          pageContext,
          history,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.ok !== true || typeof payload?.reply !== "string") {
        throw new Error("concierge_unavailable");
      }
      setMessages((current) => [...current, { role: "assistant", content: payload.reply }]);
      setNeedsHuman(Boolean(payload.needsHuman));
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Tive uma dificuldade para responder agora. Prefiro não arriscar uma informação errada; nossa equipe pode confirmar para você.",
        },
      ]);
      setNeedsHuman(true);
    } finally {
      setLoading(false);
    }
  }

  function openWidget() {
    setOpen(true);
    setShowNudge(false);
  }

  return (
    <div className="rf-concierge-root" aria-live="polite">
      {showNudge && !open ? (
        <button type="button" className="rf-concierge-nudge" onClick={openWidget}>
          <span>✨</span>
          <span>
            <strong>Posso ajudar com seu evento?</strong>
            <small>Tire dúvidas aqui antes de ir para o WhatsApp.</small>
          </span>
          <span className="rf-concierge-nudge-arrow">→</span>
        </button>
      ) : null}

      {open ? (
        <section className="rf-concierge-panel" aria-label="Concierge Roda Festa">
          <header className="rf-concierge-header">
            <div>
              <span className="rf-concierge-eyebrow">CONCIERGE RODA FESTA</span>
              <strong>Seu evento começa aqui.</strong>
            </div>
            <button type="button" className="rf-concierge-close" onClick={() => setOpen(false)} aria-label="Fechar concierge">×</button>
          </header>

          <div className="rf-concierge-messages" ref={listRef}>
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`rf-concierge-message rf-concierge-message--${message.role}`}>
                {message.content}
              </div>
            ))}
            {loading ? <div className="rf-concierge-message rf-concierge-message--assistant rf-concierge-typing">Pensando<span>.</span><span>.</span><span>.</span></div> : null}
          </div>

          {messages.length <= 2 ? (
            <div className="rf-concierge-prompts">
              {QUICK_PROMPTS.map((prompt) => (
                <button type="button" key={prompt} onClick={() => sendMessage(prompt)}>{prompt}</button>
              ))}
            </div>
          ) : null}

          {needsHuman ? (
            <div className="rf-concierge-handoff">
              <strong>Quer continuar com a equipe?</strong>
              <span>O Concierge não inventa disponibilidade, desconto ou condição comercial.</span>
            </div>
          ) : null}

          <form
            className="rf-concierge-form"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={900}
              placeholder="Pergunte sobre seu evento..."
              aria-label="Mensagem para o Concierge Roda Festa"
            />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Enviar mensagem">↑</button>
          </form>

          <p className="rf-concierge-footnote">Informações comerciais especiais e disponibilidade são confirmadas pela equipe.</p>
        </section>
      ) : (
        <button type="button" className="rf-concierge-launcher" onClick={openWidget} aria-label="Abrir Concierge Roda Festa">
          <span className="rf-concierge-launcher-spark">✦</span>
          <span className="rf-concierge-launcher-copy"><strong>Concierge</strong><small>Posso ajudar?</small></span>
        </button>
      )}
    </div>
  );
}
