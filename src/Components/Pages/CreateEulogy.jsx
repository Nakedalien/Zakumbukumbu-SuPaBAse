import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '../Footer';
import './Eulogies.css';
import { createEulogy, getMemorials } from '../../data/eulogies';
import { getAuthSession } from '../../data/auth';

const initialForm = {
  memorial_id: 'new',
  full_name: '',
  born_on: '',
  died_on: '',
  author_name: '',
  summary: '',
  story: '',
  donation_mpesa: '',
  donation_bank: '',
  donation_paypal: '',
};

function CreateEulogy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [memorials, setMemorials] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [authSession, setAuthSession] = useState(() => getAuthSession());

  useEffect(() => {
    let mounted = true;
    getMemorials()
      .then((items) => {
        if (!mounted) return;
        setMemorials(items);
        const requestedMemorial = searchParams.get('memorial');
        if (requestedMemorial && items.some((memorial) => memorial.id === requestedMemorial)) {
          setForm((current) => ({ ...current, memorial_id: requestedMemorial }));
        }
      })
      .catch(() => {
        if (mounted) {
          setMemorials([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    function refreshSession() {
      setAuthSession(getAuthSession());
    }

    window.addEventListener('zakumbukumbu-auth-change', refreshSession);
    window.addEventListener('storage', refreshSession);

    return () => {
      window.removeEventListener('zakumbukumbu-auth-change', refreshSession);
      window.removeEventListener('storage', refreshSession);
    };
  }, []);

  const selectedMemorial = useMemo(
    () => memorials.find((memorial) => memorial.id === form.memorial_id),
    [form.memorial_id, memorials],
  );
  const isNewMemorial = form.memorial_id === 'new';

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateCoverPhoto(event) {
    setCoverPhoto(event.target.files?.[0] || null);
  }

  function updateGalleryPhotos(event) {
    setGalleryPhotos(Array.from(event.target.files || []));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('saving');
    setError('');

    if (isNewMemorial && !authSession) {
      setError('Please log in or create a creator account before creating a new memorial.');
      setStatus('idle');
      return;
    }

    try {
      const saved = await createEulogy({
        ...form,
        cover_photo: isNewMemorial ? coverPhoto : null,
        gallery_photos: galleryPhotos,
      });
      navigate(`/Eulogies/${saved.slug}`);
    } catch {
      setError('The eulogy could not be saved. Please check the details and try again.');
      setStatus('idle');
    }
  }

  return (
    <>
      <main className="create-page">
        <section className="create-intro">
          <span className="section-kicker">Create a Tribute</span>
          <h1>Share a eulogy with care.</h1>
          <p>Add a new memorial profile, or choose an existing person and add your own eulogy to their page.</p>
        </section>

        <form className="eulogy-form" onSubmit={handleSubmit}>
          <label>
            Who is this eulogy for?
            <select name="memorial_id" value={form.memorial_id} onChange={updateField}>
              <option value="new">Create a new memorial</option>
              {memorials.map((memorial) => (
                <option value={memorial.id} key={memorial.id}>{memorial.full_name}</option>
              ))}
            </select>
          </label>

          {!isNewMemorial && selectedMemorial && (
            <div className="selected-memorial">
              <strong>{selectedMemorial.full_name}</strong>
              <span>{selectedMemorial.lifespan}</span>
              <small>{selectedMemorial.eulogies.length === 1 ? '1 eulogy already shared' : selectedMemorial.eulogies.length + ' eulogies already shared'}</small>
            </div>
          )}

          {isNewMemorial && (
            <>
              <section className="creator-account-notice">
                <div>
                  <span className="section-kicker">Creator Account</span>
                  <h2>{authSession ? `Signed in as ${authSession.user.name}` : 'Log in before creating a memorial.'}</h2>
                  <p>Creator accounts protect memorial management. Guests can still add eulogies to existing memorials without logging in.</p>
                </div>
                {!authSession && (
                  <Link className="primary-link compact-link" to="/Account?next=/CreateEulogy">Log in or create account</Link>
                )}
              </section>

              <label>
                Full name
                <input name="full_name" value={form.full_name} onChange={updateField} required />
              </label>

              <div className="form-row">
                <label>
                  Born
                  <input name="born_on" type="date" value={form.born_on} onChange={updateField} />
                </label>
                <label>
                  Died
                  <input name="died_on" type="date" value={form.died_on} onChange={updateField} />
                </label>
              </div>

              <label>
                Cover photo
                <input type="file" accept="image/*" onChange={updateCoverPhoto} />
                {coverPhoto && <span className="file-note">Selected: {coverPhoto.name}</span>}
              </label>

              <label>
                Short memorial summary
                <textarea name="summary" value={form.summary} onChange={updateField} rows="3" required />
              </label>

              <fieldset className="donation-fields">
                <legend>Donation details</legend>
                <p>Add only the options the family wants to share. Blank fields stay hidden on the memorial page.</p>
                <label>
                  Mpesa
                  <textarea
                    name="donation_mpesa"
                    value={form.donation_mpesa}
                    onChange={updateField}
                    rows="2"
                    placeholder="Till, Paybill, phone number, or instructions"
                  />
                </label>
                <label>
                  Bank
                  <textarea
                    name="donation_bank"
                    value={form.donation_bank}
                    onChange={updateField}
                    rows="2"
                    placeholder="Bank name, account name, account number, branch, or instructions"
                  />
                </label>
                <label>
                  PayPal
                  <textarea
                    name="donation_paypal"
                    value={form.donation_paypal}
                    onChange={updateField}
                    rows="2"
                    placeholder="PayPal email, link, or instructions"
                  />
                </label>
              </fieldset>
            </>
          )}

          <label>
            Your name
            <input name="author_name" value={form.author_name} onChange={updateField} required />
          </label>

          <label>
            Photos to add
            <input type="file" accept="image/*" multiple onChange={updateGalleryPhotos} />
            {galleryPhotos.length > 0 && <span className="file-note">{galleryPhotos.length} photo{galleryPhotos.length === 1 ? '' : 's'} selected</span>}
          </label>

          <label>
            Your eulogy
            <textarea name="story" value={form.story} onChange={updateField} rows="10" required />
          </label>

          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : isNewMemorial ? 'Create Memorial' : 'Add Eulogy'}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}

export default CreateEulogy;
