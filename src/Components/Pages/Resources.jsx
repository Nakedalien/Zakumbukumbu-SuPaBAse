import { Link } from 'react-router-dom';
import Footer from '../Footer';
import './Eulogies.css';

const resources = [
  {
    title: 'Writing a Eulogy',
    body: 'Start with one honest memory, then add the qualities and small details that made the person loved.',
  },
  {
    title: 'Collecting Memories',
    body: 'Invite family and friends to share photos, short stories, and moments that show a fuller life.',
  },
  {
    title: 'Sharing a Memorial',
    body: 'Use the share link on each memorial page to send it to someone who should see it.',
  },
];

function Resources() {
  return (
    <>
      <main className="content-page">
        <section className="content-panel">
          <span className="section-kicker">Resources</span>
          <h1>Guidance for remembering well.</h1>
          <p>
            Practical prompts and simple steps for writing tributes, collecting stories, and sharing memorial pages with care.
          </p>
          <div className="content-actions">
            <Link className="primary-link" to="/CreateEulogy">Create a Tribute</Link>
            <Link className="secondary-link" to="/Eulogies">Browse Eulogies</Link>
          </div>
        </section>

        <section className="content-grid">
          {resources.map((resource) => (
            <article key={resource.title}>
              <h2>{resource.title}</h2>
              <p>{resource.body}</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Resources;
