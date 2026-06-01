import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from '../Footer';
import './Eulogies.css';
import { getAuthSession, loginCreatorAccount, logoutCreatorAccount, registerCreatorAccount, syncAuthSession } from '../../data/auth';
import logo from '../../assets/Logo.png';
import candleGif from '../../assets/candle.gif';

function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authSession, setAuthSession] = useState(() => getAuthSession());
  const [authMode, setAuthMode] = useState('login');
  const [hasSwitchedMode, setHasSwitchedMode] = useState(false);
  const [authStatus, setAuthStatus] = useState('idle');
  const [authError, setAuthError] = useState('');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  const nextPath = useMemo(() => {
    const next = new URLSearchParams(location.search).get('next');
    return next?.startsWith('/') ? next : '';
  }, [location.search]);

  useEffect(() => {
    let mounted = true;

    syncAuthSession().then((session) => {
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

  function updateAuthField(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  function switchAuthMode(nextMode) {
    if (nextMode === authMode) return;
    setHasSwitchedMode(true);
    setAuthError('');
    setAuthMode(nextMode);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthStatus('saving');
    setAuthError('');

    try {
      const session = authMode === 'register'
        ? await registerCreatorAccount(authForm)
        : await loginCreatorAccount({ email: authForm.email, password: authForm.password });
      setAuthSession(session);
      setAuthForm({ name: '', email: '', password: '' });
      setAuthStatus('idle');

      if (nextPath) {
        navigate(nextPath);
      }
    } catch (error) {
      setAuthError(authMode === 'register'
        ? error.message || 'The account could not be created. Try a different email or password.'
        : 'Login failed. Check your email and password.');
      setAuthStatus('idle');
    }
  }

  async function handleLogout() {
    await logoutCreatorAccount();
    setAuthSession(null);
  }

  return (
    <>
      <main className="auth-page">
        <section className={`auth-card ${authSession ? 'is-authenticated' : `is-${authMode}-mode ${hasSwitchedMode ? 'has-switched-mode' : ''}`}`}>
          <div className="auth-main">
            <div className="auth-card-copy">
              <span className="section-kicker">Creator Account</span>
              <h1>{authSession ? 'Your memorial workspace.' : authMode === 'register' ? 'Create your account.' : 'Welcome back.'}</h1>
              <p>Only memorial creators need an account. Family and friends can still add eulogies to existing memorials as guests.</p>
            </div>

            {authSession ? (
              <div className="creator-account-signed-in account-signed-in">
                <div>
                  <span>Hello, {authSession.user.name}</span>
                  <p>{authSession.user.role === 'admin' ? 'Administrator account' : 'Creator account'}</p>
                </div>
                <div className="account-actions">
                  <Link className="primary-link compact-link" to="/CreateEulogy">Create Memorial</Link>
                  <button type="button" onClick={handleLogout}>Log out</button>
                </div>
              </div>
            ) : (
              <form className="creator-account-form account-form" onSubmit={handleAuthSubmit}>
                <div className="auth-mode-toggle">
                  <button className={authMode === 'login' ? 'active' : ''} type="button" onClick={() => switchAuthMode('login')}>Log in</button>
                  <button className={authMode === 'register' ? 'active' : ''} type="button" onClick={() => switchAuthMode('register')}>Create account</button>
                </div>

                <div className="auth-fields" key={authMode}>
                  {authMode === 'register' && (
                    <label>
                      Name
                      <input name="name" value={authForm.name} onChange={updateAuthField} required />
                    </label>
                  )}
                  <label>
                    Email
                    <input name="email" type="email" value={authForm.email} onChange={updateAuthField} required />
                  </label>
                  <label>
                    Password
                    <input name="password" type="password" value={authForm.password} onChange={updateAuthField} required />
                  </label>
                </div>

                {authError && <p className="form-error">{authError}</p>}
                <button type="submit" disabled={authStatus === 'saving'}>
                  {authStatus === 'saving' ? 'Please wait...' : authMode === 'register' ? 'Create Account' : 'Log In'}
                </button>
              </form>
            )}
          </div>

          <aside className="auth-visual" aria-label="ZaKumbukumbu account">
            <img className="auth-logo" src={logo} alt="ZaKumbukumbu" />
            <div className="auth-candle-frame" aria-hidden="true">
              <img src={candleGif} alt="" />
            </div>
            <div className="auth-visual-copy">
              <strong>Protected memorial care</strong>
              <span>{authSession?.user.role === 'admin' ? 'Administrator access enabled' : 'Creator access for memorial management'}</span>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Account;



