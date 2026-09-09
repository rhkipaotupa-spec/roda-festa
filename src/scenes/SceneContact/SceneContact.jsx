import "./SceneContact.css";

const WHATSAPP_URL = "https://wa.me/5514998960208?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Roda%20Festa%20e%20quero%20falar%20sobre%20meu%20evento.";

export default function SceneContact() {
  return (
    <section id="contato" className="scene-contact" aria-labelledby="scene-contact-title">
      <div className="container scene-contact__inner">
        <div className="scene-contact__copy">
          <span className="scene-contact__eyebrow">Contato</span>
          <h2 id="scene-contact-title">Seu evento pode começar por aqui.</h2>
          <p>Monte uma primeira composição no Planning Book ou fale diretamente com a equipe da Roda Festa para continuar o atendimento.</p>
        </div>
        <div className="scene-contact__actions">
          <a className="scene-contact__primary" href="/planning-book">Planejar meu evento</a>
          <a className="scene-contact__secondary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Falar com a equipe no WhatsApp</a>
          <small>WhatsApp oficial: (14) 99896-0208</small>
        </div>
      </div>
    </section>
  );
}
