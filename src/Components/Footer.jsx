import './Footer.css';
import { Link } from 'react-router-dom';
import logoWhite from '../assets/Logowhite.png';

function Footer() {
  return (
    <div className="footer">
      <div className="note">
        <img src={logoWhite} id="low" alt="ZaKumbukumbu" />
        <p>A platform to honor, remember and celebrate lives through eulogies, stories, and shared memories.</p>
      </div>
      <div className="exp">
        <h3>Explore</h3>
        <Link to="/Eulogies" id="lin">Eulogies</Link>
        <Link to="/Eulogies" id="lin">Memorials</Link>
        <Link to="/Resources" id="lin">Resources</Link>
        <Link to="/Eulogies" id="lin">Support</Link>
        <Link to="/Eulogies" id="lin">FAQs</Link>
      </div>
      <div className="com">
        <h3>Company</h3>
        <Link to="/Eulogies" id="lin">About Us</Link>
        <Link to="/Eulogies" id="lin">Our Mission</Link>
        <Link to="/Contact" id="lin">Contact us</Link>
      </div>
      <div className="sup">
        <h3>Support</h3>
      </div>
      <div className="but">
        <Link to="/Contact" id="conbut">Contact Us</Link>
      </div>
    </div>
  );
}

export default Footer;