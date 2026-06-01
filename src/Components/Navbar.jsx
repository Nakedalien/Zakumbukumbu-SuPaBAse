import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/Logo.png';
import { getCurrentCreator, logoutCreatorAccount } from '../data/auth';
import './Navbar.css';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [creator, setCreator] = useState(() => getCurrentCreator());

  useEffect(() => {
    function refreshCreator() {
      setCreator(getCurrentCreator());
    }

    window.addEventListener('zakumbukumbu-auth-change', refreshCreator);
    window.addEventListener('storage', refreshCreator);

    return () => {
      window.removeEventListener('zakumbukumbu-auth-change', refreshCreator);
      window.removeEventListener('storage', refreshCreator);
    };
  }, []);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  async function handleLogout() {
    await logoutCreatorAccount();
    setCreator(null);
    closeMenu();
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="Logz">
          <Link to="/" onClick={closeMenu}>
            <img id="logo" src={logo} alt="ZaKumbukumbu" />
          </Link>
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <div className={`navbar-container ${isMenuOpen ? 'is-open' : ''}`}>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-links" id="hom" onClick={closeMenu}>Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/Eulogies" className="nav-links" id="eul" onClick={closeMenu}>Eulogies</Link>
          </li>
          <li className="nav-item">
            <Link to="/Resources" className="nav-links" id="res" onClick={closeMenu}>Resources</Link>
          </li>
          <li className="nav-item">
            <Link to="/Contact" className="nav-links" id="con" onClick={closeMenu}>Contact</Link>
          </li>
          <li className="nav-item nav-action">
            <Link to="/CreateEulogy" className="tribut" onClick={closeMenu}>Create a Tribute</Link>
          </li>
          <li className="nav-item nav-account">
            <span className="nav-greeting">Hello, {creator?.name || 'Guest'}</span>
            {creator ? (
              <button className="nav-logout" type="button" onClick={handleLogout}>Log out</button>
            ) : (
              <Link to="/Account" className="nav-signin" onClick={closeMenu}>Sign in</Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
