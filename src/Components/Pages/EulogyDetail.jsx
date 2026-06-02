import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Footer from '../Footer';
import './Eulogies.css';
import { canManageMemorial, createEulogy, deleteEulogyEntry, deleteMemorial, deleteMemorialPhoto, getMemorialBySlug } from '../../data/eulogies';
import { getAuthSession, syncAuthSession } from '../../data/auth';
import sendIcon from '../../assets/send.png';
import donationCandle from '../../assets/candle.gif';
import { shareMemorial } from '../shareMemorial';

function EulogyDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [memorial, setMemorial] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [status, setStatus] = useState('loading');
  const [isAddingEulogy, setIsAddingEulogy] = useState(false);
  const [newEulogy, setNewEulogy] = useState({ author_name: '', story: '' });
  const [newPhotos, setNewPhotos] = useState([]);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [formError, setFormError] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('idle');
  const [deleteError, setDeleteError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [authSession, setAuthSession] = useState(() => getAuthSession());
  const [showDonationDetails, setShowDonationDetails] = useState(false);
  const feedbackTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    getMemorialBySlug(slug)
      .then((item) => {
        if (mounted) {
          setMemorial(item);
          setIsAddingEulogy(false);
          setNewEulogy({ author_name: '', story: '' });
          setNewPhotos([]);
          setShowDonationDetails(false);
          setStatus(item ? 'ready' : 'missing');
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus('error');
        }
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    let mounted = true;

    syncAuthSession({ forceRefresh: true }).then((session) => {
      if (mounted) setAuthSession(session);
    });

    function refreshSession() {
      setAuthSession(getAuthSession());
    }

    window.addEventListener('zakumbukumbu-auth-change', refreshSession);
    window.addEventListener('storage', refreshSession);

    return () => {
      mounted = false;
      window.removeEventListener('zakumbukumbu-auth-change', refreshSession);
      window.removeEventListener('storage', refreshSession);
    };
  }, []);

  useEffect(() => () => {
    if (feedbackTimer.current) {
      window.clearTimeout(feedbackTimer.current);
    }
  }, []);

  function showShareFeedback(label) {
    setShareFeedback(label);

    if (feedbackTimer.current) {
      window.clearTimeout(feedbackTimer.current);
    }

    feedbackTimer.current = window.setTimeout(() => {
      setShareFeedback('');
    }, 1800);
  }

  async function handleShareMemorial() {
    if (!memorial) return;

    try {
      const result = await shareMemorial(memorial);
      if (result === 'idle') return;

      showShareFeedback(result === 'shared' ? 'Shared' : result === 'copied' ? 'Link copied' : 'Copy link shown');
    } catch {
      showShareFeedback('Share failed');
    }
  }

  function updateNewEulogy(event) {
    const { name, value } = event.target;
    setNewEulogy((current) => ({ ...current, [name]: value }));
  }

  function updateNewPhotos(event) {
    setNewPhotos(Array.from(event.target.files || []));
  }

  async function handleAddEulogy(event) {
    event.preventDefault();
    if (!memorial) return;

    setSaveStatus('saving');
    setFormError('');

    try {
      await createEulogy({
        memorial_id: memorial.id,
        author_name: newEulogy.author_name,
        story: newEulogy.story,
        gallery_photos: newPhotos,
      });
      const refreshedMemorial = await getMemorialBySlug(slug);
      setMemorial(refreshedMemorial);
      setNewEulogy({ author_name: '', story: '' });
      setNewPhotos([]);
      setIsAddingEulogy(false);
      setSaveStatus('idle');
    } catch {
      setFormError('The eulogy could not be added. Please try again.');
      setSaveStatus('idle');
    }
  }

  function requestDeleteEulogy(eulogy) {
    if (!memorial || !eulogy.id) return;
    setPendingDelete({ type: 'eulogy', eulogy });
  }

  function requestDeleteMemorial() {
    if (!memorial) return;
    setPendingDelete({ type: 'memorial' });
  }

  function requestDeletePhoto(photo) {
    if (!memorial || !photo.id || photo.id === 'cover-photo') return;
    setPendingDelete({ type: 'photo', photo });
  }

  async function confirmDelete() {
    if (!memorial || !pendingDelete) return;

    const deleteId = pendingDelete.type === 'memorial'
      ? 'memorial'
      : pendingDelete.type === 'photo'
        ? `photo-${pendingDelete.photo.id}`
        : pendingDelete.eulogy.id;
    setDeleteStatus(deleteId);
    setDeleteError('');

    try {
      if (pendingDelete.type === 'memorial') {
        const deletedMemorialId = memorial.id;
        await deleteMemorial(memorial.id);
        window.dispatchEvent(new CustomEvent('memorial-deleted', {
          detail: { memorialId: deletedMemorialId },
        }));
        setPendingDelete(null);
        navigate('/Eulogies', { state: { deletedMemorialId } });
        return;
      }

      if (pendingDelete.type === 'photo') {
        await deleteMemorialPhoto(memorial.id, pendingDelete.photo.id);
        const refreshedMemorial = await getMemorialBySlug(slug);
        setMemorial(refreshedMemorial);
        setSelectedPhoto((current) => (
          current?.id === pendingDelete.photo.id ? null : current
        ));
        setPendingDelete(null);
        setDeleteStatus('idle');
        return;
      }

      await deleteEulogyEntry(memorial.id, pendingDelete.eulogy.id);
      setMemorial((current) => (
        current
          ? {
            ...current,
            eulogies: current.eulogies.filter((eulogy) => eulogy.id !== pendingDelete.eulogy.id),
          }
          : current
      ));
      setPendingDelete(null);
      setDeleteStatus('idle');
    } catch (error) {
      setDeleteError(
        error.message || (pendingDelete.type === 'memorial'
          ? 'The memorial could not be deleted. Please try again.'
          : pendingDelete.type === 'photo'
            ? 'The photo could not be deleted. Please try again.'
            : 'The eulogy could not be deleted. Please try again.'),
      );
      setDeleteStatus('idle');
    }
  }

  if (status === 'loading') {
    return <main className="eulogy-detail"><p className="page-note">Loading eulogies...</p></main>;
  }

  if (status === 'missing' || status === 'error') {
    return (
      <>
        <main className="eulogy-detail detail-empty">
          <span className="section-kicker">Eulogy</span>
          <h1>This memorial could not be found.</h1>
          <Link className="primary-link" to="/Eulogies">Back to Eulogies</Link>
        </main>
        <Footer />
      </>
    );
  }

  const galleryPhotos = memorial.photos?.length
    ? memorial.photos
    : memorial.image_url
      ? [{ id: 'cover-photo', image_url: memorial.image_url, caption: memorial.full_name }]
      : [];
  const donationMethods = [
    { label: 'Mpesa', value: memorial.donation_mpesa },
    { label: 'Bank', value: memorial.donation_bank },
    { label: 'PayPal', value: memorial.donation_paypal },
  ].filter((method) => method.value?.trim());
  const canManage = canManageMemorial(memorial, authSession?.user);

  return (
    <>
      <main className="eulogy-detail">
        <Link className="back-link" to="/Eulogies">Back to Eulogies</Link>
        <article className="detail-layout">
          <aside className="detail-side">
            <div
              className="detail-photo"
              style={memorial.image_url ? { backgroundImage: `url(${memorial.image_url})` } : undefined}
            >
              {!memorial.image_url && <span>{memorial.full_name.charAt(0)}</span>}
            </div>
          </aside>
          <section className="detail-copy">
            <div className="detail-header-actions">
              <span className="section-kicker">In loving memory</span>
              <div className="detail-action-stack">
                <div className="detail-actions">
                  <button className="share-link-button detail-share-button" type="button" onClick={handleShareMemorial}>
                    <img src={sendIcon} alt="" aria-hidden="true" />
                    {shareFeedback || 'Share'}
                  </button>
                  <button className="primary-link compact-link" type="button" onClick={() => setIsAddingEulogy((current) => !current)}>
                    {isAddingEulogy ? 'Close Form' : 'Add Eulogy'}
                  </button>
                  {canManage && (
                    <button className="delete-link-button" type="button" onClick={requestDeleteMemorial} disabled={deleteStatus === 'memorial'}>
                      {deleteStatus === 'memorial' ? 'Deleting...' : 'Delete Memorial'}
                    </button>
                  )}
                </div>
                <button
                  className="donation-gif-button"
                  type="button"
                  onClick={() => setShowDonationDetails((current) => !current)}
                  aria-expanded={showDonationDetails}
                  aria-controls="donation-details"
                >
                  <img src={donationCandle} alt="" aria-hidden="true" />
                  <span>{donationMethods.length > 0 ? 'Donation details' : 'No donation details'}</span>
                </button>
              </div>
            </div>
            <h1>{memorial.full_name}</h1>
            <p className="lifespan">{memorial.lifespan}</p>
            <p className="summary-line">{memorial.summary}</p>
            {deleteError && <p className="form-error">{deleteError}</p>}

            {showDonationDetails && (
              <section className="donation-details-panel" id="donation-details" aria-label={`Donation details for ${memorial.full_name}`}>
                <div>
                  <span className="section-kicker">Family Support</span>
                  <h2>Donation Details</h2>
                </div>
                {donationMethods.length > 0 ? (
                  <div className="donation-method-list">
                    {donationMethods.map((method) => (
                      <article className="donation-method" key={method.label}>
                        <strong>{method.label}</strong>
                        <p>{method.value}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="donation-empty-note">No donation details have been added for this memorial.</p>
                )}
              </section>
            )}

            {isAddingEulogy && (
              <form className="inline-eulogy-form" onSubmit={handleAddEulogy}>
                <label>
                  Your name
                  <input name="author_name" value={newEulogy.author_name} onChange={updateNewEulogy} required />
                </label>
                <label>
                  Photos to add
                  <input type="file" accept="image/*" multiple onChange={updateNewPhotos} />
                  {newPhotos.length > 0 && <span className="file-note">{newPhotos.length} photo{newPhotos.length === 1 ? '' : 's'} selected</span>}
                </label>
                <label>
                  Your eulogy
                  <textarea name="story" value={newEulogy.story} rows="7" onChange={updateNewEulogy} required />
                </label>
                {formError && <p className="form-error">{formError}</p>}
                <button type="submit" disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Eulogy'}
                </button>
              </form>
            )}

            <section className="shared-eulogies" aria-label={`${memorial.full_name} eulogies`}>
              <h2>{memorial.eulogies.length === 1 ? '1 Eulogy' : memorial.eulogies.length + ' Eulogies'}</h2>
              {memorial.eulogies.map((eulogy) => (
                <article className="eulogy-entry" key={eulogy.id || `${eulogy.author_name}-${eulogy.created_at}`}>
                  <div className="eulogy-entry-header">
                    <div>
                      <strong>{eulogy.author_name}</strong>
                      {eulogy.written_at && <span>{eulogy.written_at}</span>}
                    </div>
                    {canManage && (
                      <button
                        className="delete-link-button eulogy-delete-button"
                        type="button"
                        onClick={() => requestDeleteEulogy(eulogy)}
                        disabled={deleteStatus === eulogy.id}
                      >
                        {deleteStatus === eulogy.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                  <div className="story-body">
                    {eulogy.story.split('\n').map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            {galleryPhotos.length > 0 && (
              <section className="photo-gallery" aria-label={`${memorial.full_name} photos`}>
                <h2>Photo memories</h2>
                <div className="photo-grid">
                  {galleryPhotos.map((photo, index) => (
                    <div className="gallery-photo-wrap" key={photo.id || photo.storage_path || photo.image_url}>
                      <button
                        className="gallery-photo"
                        type="button"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <img src={photo.image_url} alt={`${memorial.full_name} memory ${index + 1}`} />
                      </button>
                      {canManage && photo.id && photo.id !== 'cover-photo' && (
                        <button
                          className="photo-delete-button"
                          type="button"
                          onClick={() => requestDeletePhoto(photo)}
                          disabled={deleteStatus === `photo-${photo.id}`}
                        >
                          {deleteStatus === `photo-${photo.id}` ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </section>
        </article>
      </main>

      {selectedPhoto && (
        <div className="photo-lightbox" role="dialog" aria-modal="true" onClick={() => setSelectedPhoto(null)}>
          <button type="button" onClick={() => setSelectedPhoto(null)}>Close</button>
          <img src={selectedPhoto.image_url} alt={selectedPhoto.caption || memorial.full_name} onClick={(event) => event.stopPropagation()} />
        </div>
      )}

      {pendingDelete && (
        <div className="delete-confirmation-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-confirmation-title">
          <div className="delete-confirmation">
            <h2 id="delete-confirmation-title">Are you sure?</h2>
            <p>
              {pendingDelete.type === 'memorial'
                ? `This will delete the whole memorial for ${memorial.full_name} and all eulogies inside it.`
                : pendingDelete.type === 'photo'
                  ? 'This will delete this photo from the memorial gallery.'
                  : `This will delete the eulogy by ${pendingDelete.eulogy.author_name}.`}
            </p>
            <div className="delete-confirmation-actions">
              <button className="secondary-link" type="button" onClick={() => setPendingDelete(null)} disabled={deleteStatus !== 'idle'}>
                Cancel
              </button>
              <button className="delete-link-button" type="button" onClick={confirmDelete} disabled={deleteStatus !== 'idle'}>
                {deleteStatus !== 'idle' ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default EulogyDetail;
