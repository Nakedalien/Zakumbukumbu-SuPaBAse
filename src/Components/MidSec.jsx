import addIcon from '../assets/add.png';
import hourglassIcon from '../assets/hourglass.png';
import champagneIcon from '../assets/cel.png';
import Share from '../assets/send2.png';
import './Midsec.css';

function MidSec() {
  return (
    <div className="mid">
      <div className="topic">
        <p>A Place for Memories. A Home for Legacies</p>
      </div>
      <div className="raw">
        <div className="icons">
          <img src={addIcon} alt="" />
          <h4>Create Tribute</h4>
          <p>Build a beautiful memorial page to honor your loved one</p>
        </div>
        <div className="icons">
          <img src={Share} alt="" />
          <h4>Share & Invite</h4>
          <p>Invite family and friends to share memories and messages</p>
        </div>
        <div className="icons">
          <img src={hourglassIcon} alt="" />
          <h4>Preserve Stories</h4>
          <p>Preserve photos, videos, and stories for generations</p>
        </div>
        <div className="icons">
          <img src={champagneIcon} alt="" />
          <h4>Celebrate Legacy</h4>
          <p>Celebrate a life well lived and the impact they made</p>
        </div>
      </div>
    </div>
  );
}

export default MidSec;
