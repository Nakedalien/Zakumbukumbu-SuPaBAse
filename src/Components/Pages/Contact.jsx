import { Link } from 'react-router-dom';
import Footer from '../Footer';
import './Eulogies.css';

function Contact() {
  return (
    <>
      <main className="content-page">
        <section className="content-panel">
          <span className="section-kicker">Contact</span>
          <h1>We are here to help.</h1>
          <p>
            Reach out for support with memorial pages, eulogy submissions, or questions about preserving a loved one's story.
          </p>
          <div className="content-actions">
            <a className="primary-link" href="mailto:support@zakumbukumbu.com">Email Support</a>
            <Link className="secondary-link" to="/CreateEulogy">Create a Tribute</Link>
          </div>
        </section>

        <section className="content-grid">
          <article>
            <h2>Memorial Support</h2>
            <p>Get help creating, updating, or sharing a memorial page.</p>
          </article>
          <article>
            <h2>Family Invitations</h2>
            <p>Ask about inviting family and friends to contribute memories.</p>
          </article>
          <article>
            <h2>General Questions</h2>
            <p>Send questions about resources, privacy, or using the platform.</p>
          </article>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Contact;
