import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./concierge.css";

const WHATSAPP_URL = "https://wa.me/5514998960208?text=Ol%C3%A1%21%20Vim%20pelo%20Assistente%20Roda%20Festa%20e%20gostaria%20de%20continuar%20meu%20atendimento.";
const DEFAULT_HUMAN_ACTIONS = Object.freeze([
  Object.freeze({ type: "whatsapp", label: "Falar com a equipe" }),
]);

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

function normalizeActions(payloadActions, needsHuman) {
  const allowedTypes = new Set(["planning-book", "whatsapp"]);
  const actions = (Array.isArray(payloadActions) ? payloadActions : [])
    .filter((action) => action && allowedTypes.has(action.type))
    .map((action) => ({
      type: action.type,
      label: String(action.label || "").trim() || (action.type === "whatsapp" ? "Falar com a equipe" : "Abrir Planning Book"),
    }))
    .slice(0, 2);

  if (actions.length > 0) return actions;
  return needsHuman ? [...DEFAULT_HUMAN_ACTIONS] : [];
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
      content: "Olá ✨ Sou o Assistente Roda Festa. Posso explicar como funciona o serviço, mostrar opções do cardápio, orientar seu planejamento e te conectar com nossa equipe quando precisar.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsHuman, setNeedsHuman] = useState(false);
  const [actions, setActions] = useState([]);
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
  }, [messages, loading, actions]);

  const history = useMemo(
    () => messages.slice(-8).map(({ role, content }) => ({ role, content })),
    [messages],
  );

  if (hidden) return null;

  function runAction(action) {
    if (action.type === "planning-book") {
      if (location.pathname === "/planning-book") {
        setOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      window.location.assign("/planning-book");
      return;
    }

    if (action.type === "whatsapp") {
      window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
    }
  }

  async function sendMessage(rawText) {
    const text = String(rawText || "").trim();
    if (!text || loading) return;

    const nextUser = { role: "user", content: text };
    setMessages((current) => [...current, nextUser]);
    setInput("");
    setLoading(true);
    setNeedsHuman(false);
    setActions([]);
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
      const human = Boolean(payload.needsHuman);
      setMessages((current) => [...current, { role: "assistant", content: payload.reply }]);
      setNeedsHuman(human);
      setActions(normalizeActions(payload.actions, human));
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Tive uma dificuldade para responder agora. Prefiro não arriscar uma informação errada; nossa equipe pode confirmar para você.",
        },
      ]);
      setNeedsHuman(true);
      setActions([...DEFAULT_HUMAN_ACTIONS]);
    } finally {
      setLoading(false);
    }
  }

  function openWidget() {
    setOpen(true);
    setShowNudge(false);
  }

  const intro = messages.length <= 1 && !loading && actions.length === 0 && !needsHuman;

  return (
    <div className="rf-concierge-root" aria-live="polite">
      {showNudge && !open ? (
        <button type="button" className="rf-concierge-nudge" onClick={openWidget}>
          <span>✨</span>
          <span>
            <strong>Posso ajudar com seu evento?</strong>
            <small>Tire dúvidas aqui antes de falar com nossa equipe.</small>
          </span>
          <span className="rf-concierge-nudge-arrow">→</span>
        </button>
      ) : null}

      {open ? (
        <section className={`rf-concierge-panel${intro ? " rf-concierge-panel--intro" : ""}`} aria-label="Assistente Roda Festa">
          <header className="rf-concierge-header">
            <div>
              <span className="rf-concierge-eyebrow">ASSISTENTE RODA FESTA</span>
              <strong>Seu evento começa aqui.</strong>
            </div>
            <button type="button" className="rf-concierge-close" onClick={() => setOpen(false)} aria-label="Fechar assistente">×</button>
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
              <strong>Fale com nossa equipe</strong>
              <span>Use o botão abaixo para continuar pelo WhatsApp.</span>
            </div>
          ) : null}

          {actions.length > 0 ? (
            <div className="rf-concierge-actions" aria-label="Próximos passos">
              {actions.map((action) => (
                <button
                  type="button"
                  key={action.type}
                  className={`rf-concierge-action rf-concierge-action--${action.type}`}
                  onClick={() => runAction(action)}
                >
                  <span>{action.type === "whatsapp" ? "↗" : "→"}</span>
                  {action.label}
                </button>
              ))}
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
              aria-label="Mensagem para o Assistente Roda Festa"
            />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Enviar mensagem">↑</button>
          </form>

          <p className="rf-concierge-footnote">Disponibilidade, negociação e informações que exigem confirmação são tratadas pela equipe.</p>
        </section>
      ) : showNudge ? null : (
        <button type="button" className="rf-concierge-launcher" onClick={openWidget} aria-label="Abrir Assistente Roda Festa">
          <span className="rf-concierge-launcher-spark">✦</span>
          <span className="rf-concierge-launcher-copy"><strong>Posso ajudar?</strong><small>Assistente Roda Festa</small></span>
        </button>
      )}
    </div>
  );
}
