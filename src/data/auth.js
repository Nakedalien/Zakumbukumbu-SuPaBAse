import { isSupabaseConfigured, supabase } from './supabaseClient';

const authStorageKey = 'zakumbukumbu:creator-account:v1';

function emitAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('zakumbukumbu-auth-change'));
  }
}

function readSession() {
  if (typeof localStorage === 'undefined') return null;

  try {
    return JSON.parse(localStorage.getItem(authStorageKey) || 'null');
  } catch {
    localStorage.removeItem(authStorageKey);
    return null;
  }
}

function saveSession(session) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(authStorageKey, JSON.stringify(session));
  emitAuthChange();
}

function clearSession() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(authStorageKey);
  emitAuthChange();
}

function publicUser(user, session) {
  if (!user) return null;

  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Creator';
  const role = user.app_metadata?.role === 'admin' ? 'admin' : 'creator';

  return {
    token: session?.access_token || '',
    user: {
      id: user.id,
      name,
      email: user.email || '',
      role,
    },
  };
}

function saveSupabaseSession(session, fallbackUser = null) {
  const nextSession = session ? publicUser(session.user, session) : publicUser(fallbackUser, null);

  if (nextSession?.token) {
    saveSession(nextSession);
    return nextSession;
  }

  clearSession();
  return null;
}

if (isSupabaseConfigured && supabase) {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) {
      saveSupabaseSession(data.session);
    }
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    saveSupabaseSession(session);
  });
}

export async function syncAuthSession({ forceRefresh = false } = {}) {
  if (!isSupabaseConfigured || !supabase) return readSession();

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    clearSession();
    return null;
  }

  if (!forceRefresh) {
    return saveSupabaseSession(data.session);
  }

  const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession(data.session);
  if (refreshError || !refreshedData.session) {
    return saveSupabaseSession(data.session);
  }

  return saveSupabaseSession(refreshedData.session);
}

export function getAuthSession() {
  return readSession();
}

export function getCurrentCreator() {
  return readSession()?.user || null;
}

export function authHeaders() {
  const token = readSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isMemorialCreator(memorial, creator = getCurrentCreator()) {
  return Boolean(creator?.role === 'admin' || (creator?.id && memorial?.creator_account_id === creator.id));
}

export async function registerCreatorAccount(input) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
      },
    },
  });

  if (error) throw error;

  if (!data.session) {
    throw new Error('Please confirm the email address, then log in.');
  }

  return saveSupabaseSession(data.session);
}

export async function loginCreatorAccount(input) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) throw error;

  return saveSupabaseSession(data.session);
}

export async function logoutCreatorAccount() {
  try {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
  } finally {
    clearSession();
  }
}
