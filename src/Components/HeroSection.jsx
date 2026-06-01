import { Link } from 'react-router-dom';
import beigeImage from '../assets/beige.png';
import womanImage from '../assets/blanket.png';
import './HeroSection.css';

function HeroSection() {
  return (
    <div className="heroContainer" style={{ backgroundImage: `url(${womanImage})` }}>
      <div className="beige"><img id="beige" src={beigeImage} alt="" /></div>
      <div className="onvid">
        <h1 id="cel">Celebrate.<br />Remember.</h1>
        <h1 id="hon">Honor a Life.</h1>
        <hr />
        <p className="hero-copy">A space to eulogize, remember, and celebrate the lives of those who touched ours. Their journey continues in our stories.</p>
        <Link id="tributt" to="/CreateEulogy">Create a Tribute</Link>
      </div>
    </div>
  );
}

export default HeroSection;
