import "./Header.css";
import logoRodaFesta from "../../../assets/logo-roda-festa.png";

function Header() {
  return (
    <header className="header">
      <div className="container header-content">
        <a href="/" className="header-logo" aria-label="Página inicial Roda Festa">
          <img src={logoRodaFesta} alt="Roda Festa" />
        </a>

        <nav className="header-menu" aria-label="Navegação principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#eventos">Eventos</a>
          <a href="#cardapio">Cardápio</a>
          <a href="#contato">Contato</a>
        </nav>

        <a
          className="header-whatsapp"
          href="/planning-book"
        >
          Planejar meu evento
        </a>
      </div>
    </header>
  );
}

export default Header;