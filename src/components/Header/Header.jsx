import "./Header.css";
import logoRodaFesta from "../../assets/logo-roda-festa.png";

function Header() {
  return (
    <header className="header">
      <div className="container header-content">
        <a href="/" className="header-logo">
          <img src={logoRodaFesta} alt="Roda Festa" />
        </a>

        <nav className="header-menu">
          <a href="#como-funciona">Como funciona</a>
          <a href="#cardapio">Cardápio</a>
          <a href="#orcamento">Simular orçamento</a>
          <a href="#contato">Contato</a>
        </nav>

        <a
          className="header-whatsapp"
          href="https://wa.me/5514998960208"
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
      </div>
    </header>
  );
}

export default Header;