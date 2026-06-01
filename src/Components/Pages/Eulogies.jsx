import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../Footer';
import './Eulogies.css';
import { getMemorials } from '../../data/eulogies';
import flowerImage from '../../assets/flower.png';
import sendIcon from '../../assets/send.png';
import { shareMemorial } from '../shareMemorial';

function Eulogies() {
  const [memorials, setMemorials] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('loading');
  const [shareFeedback, setShareFeedback] = useState({ slug: '', label: '' });
  const feedbackTimer = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function loadMemorials() {
      try {
        const items = await getMemorials();
        if (mounted) {
          setMemorials(items);
          setStatus('ready');
        }
      } catch {
        if (mounted) {
          setStatus('error');
        }
      }
    }

    function handleMemorialDeleted(event) {
      const deletedMemorialId = event.detail?.memorialId;

      if (deletedMemorialId) {
        setMemorials((current) => current.filter((memorial) => memorial.id !== deletedMemorialId));
      }

      loadMemorials();
    }

    loadMemorials();
    window.addEventListener('memorial-deleted', handleMemorialDeleted);
    window.addEventListener('focus', loadMemorials);

    return () => {
      mounted = false;
      window.removeEventListener('memorial-deleted', handleMemorialDeleted);
      window.removeEventListener('focus', loadMemorials);
    };
  }, []);

  useEffect(() => () => {
    if (feedbackTimer.current) {
      window.clearTimeout(feedbackTimer.current);
    }
  }, []);

  function showShareFeedback(slug, label) {
    setShareFeedback({ slug, label });

    if (feedbackTimer.current) {
      window.clearTimeout(feedbackTimer.current);
    }

    feedbackTimer.current = window.setTimeout(() => {
      setShareFeedback({ slug: '', label: '' });
    }, 1800);
  }

  async function handleShare(memorial) {
    try {
      const result = await shareMemorial(memorial);
      if (result === 'idle') return;

      const label = result === 'shared'
        ? 'Shared'
        : result === 'copied'
          ? 'Link copied'
          : 'Copy link shown';

      showShareFeedback(memorial.slug, label);
    } catch {
      showShareFeedback(memorial.slug, 'Share failed');
    }
  }

  const filteredMemorials = useMemo(() => {
    const value = query.toLowerCase().trim();
    if (!value) return memorials;

    return memorials.filter((memorial) => (
      memorial.full_name.toLowerCase().includes(value)
      || memorial.summary.toLowerCase().includes(value)
      || memorial.eulogies.some((eulogy) => (
        eulogy.author_name.toLowerCase().includes(value)
        || eulogy.story.toLowerCase().includes(value)
      ))
    ));
  }, [memorials, query]);

  return (
    <>
      <main className="eulogies-page">
        <h1 className="sr-only">Eulogies</h1>
        <section className="eulogies-hero">
          <div className="eulogies-flower">
            <img src={flowerImage} alt="" />
          </div>
          <div className="eulogies-cta-strip">
            <div>
              <p>Every life leaves a story.</p>
              <p>Let's keep their light shining.</p>
            </div>
            <Link className="primary-link" to="/CreateEulogy">Create a Tribute</Link>
          </div>
        </section>

        <section className="eulogies-toolbar">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search memorials and eulogies"
            aria-label="Search memorials and eulogies"
          />
          <span>{filteredMemorials.length} memorials</span>
        </section>

        {status === 'loading' && <p className="page-note">Loading eulogies...</p>}
        {status === 'error' && <p className="page-note error-note">Eulogies could not be loaded. Check your database settings and try again.</p>}

        <section className="eulogy-list">
          {status === 'ready' && filteredMemorials.map((memorial) => (
            <article className="eulogy-row" key={memorial.id || memorial.slug}>
              <Link
                className="eulogy-photo"
                to={`/Eulogies/${memorial.slug}`}
                style={memorial.image_url ? { backgroundImage: `url(${memorial.image_url})` } : undefined}
              >
                {!memorial.image_url && <span>{memorial.full_name.charAt(0)}</span>}
              </Link>
              <div className="eulogy-lines">
                <Link className="eulogy-line eulogy-title-line" to={`/Eulogies/${memorial.slug}`}>
                  <strong>{memorial.full_name}</strong>
                  <span>{memorial.lifespan}</span>
                </Link>
                <Link className="eulogy-line eulogy-summary-line" to={`/Eulogies/${memorial.slug}`}>
                  {memorial.summary}
                </Link>
                <div className="eulogy-line eulogy-meta-line">
                  <span>{memorial.eulogies.length === 1 ? '1 eulogy shared' : memorial.eulogies.length + ' eulogies shared'}</span>
                  <button className="share-link-button" type="button" onClick={() => handleShare(memorial)}>
                    <img src={sendIcon} alt="" aria-hidden="true" />
                    {shareFeedback.slug === memorial.slug ? shareFeedback.label : 'Share'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Eulogies;
