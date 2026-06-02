import { authHeaders, isMemorialCreator } from './auth';
import { getSupabaseConfig, isSupabaseConfigured, supabase, supabasePhotoBucket } from './supabaseClient';

const memorialStorageKey = 'zakumbukumbu:memorials:v2';
const legacyStorageKey = 'zakumbukumbu:eulogies';
const deletedMemorialsStorageKey = 'zakumbukumbu:deleted-memorials:v1';
const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig();
const photoBucket = supabasePhotoBucket;
const hasDatabase = isSupabaseConfigured && Boolean(supabase);
const hasApi = Boolean(apiUrl) && !hasDatabase;

function getDeletedMemorialIds() {
  try {
    return JSON.parse(localStorage.getItem(deletedMemorialsStorageKey) || '[]');
  } catch {
    localStorage.removeItem(deletedMemorialsStorageKey);
    return [];
  }
}

function rememberDeletedMemorial(memorialId) {
  if (!memorialId) return;
  const deletedIds = new Set(getDeletedMemorialIds());
  deletedIds.add(memorialId);
  localStorage.setItem(deletedMemorialsStorageKey, JSON.stringify([...deletedIds]));
}

function withoutDeletedMemorials(memorials) {
  const deletedIds = new Set(getDeletedMemorialIds());
  if (deletedIds.size === 0) return memorials;

  return memorials.filter((memorial) => !deletedIds.has(memorial.id));
}

export function canManageMemorial(memorial) {
  return isMemorialCreator(memorial);
}

const starterMemorials = [
  {
    id: 'memorial-starter-1',
    full_name: 'Grace Achieng',
    slug: 'grace-achieng',
    born_on: '1958-04-18',
    died_on: '2025-09-02',
    image_url: '',
    photos: [],
    summary: 'A mother, teacher, and quiet source of courage whose kindness shaped everyone around her.',
    donation_mpesa: '',
    donation_bank: '',
    donation_paypal: '',
    eulogies: [
      {
        id: 'eulogy-starter-1',
        memorial_id: 'memorial-starter-1',
        author_name: 'The Achieng Family',
        story: 'Grace made ordinary days feel cared for. Her home was always open, her table always had room, and her words had a way of steadying people when life felt heavy. She loved deeply, taught patiently, and left behind a legacy carried in every person she encouraged.',
        created_at: '2026-05-01T10:00:00.000Z',
        published: true,
      },
    ],
    created_at: '2026-05-01T10:00:00.000Z',
    published: true,
  },
  {
    id: 'memorial-starter-2',
    full_name: 'Daniel Mwangi',
    slug: 'daniel-mwangi',
    born_on: '1949-11-07',
    died_on: '2024-12-14',
    image_url: '',
    photos: [],
    summary: 'Remembered for his humor, faith, and the generous way he made people feel seen.',
    donation_mpesa: '',
    donation_bank: '',
    donation_paypal: '',
    eulogies: [
      {
        id: 'eulogy-starter-2',
        memorial_id: 'memorial-starter-2',
        author_name: 'Mwangi Family',
        story: 'Daniel carried joy into every room. He believed in showing up for family, friends, and neighbors, not with grand speeches, but with presence, laughter, and practical help. His memory remains a blessing to all who knew him.',
        created_at: '2026-04-23T08:30:00.000Z',
        published: true,
      },
    ],
    created_at: '2026-04-23T08:30:00.000Z',
    published: true,
  },
];

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatWrittenDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function withDisplayFields(memorial) {
  const born = formatDate(memorial.born_on);
  const died = formatDate(memorial.died_on);
  const photos = Array.isArray(memorial.photos) ? memorial.photos : [];
  const eulogies = Array.isArray(memorial.eulogies) ? memorial.eulogies : [];

  return {
    ...memorial,
    photos,
    eulogies: eulogies
      .filter((eulogy) => eulogy.published !== false)
      .map((eulogy) => ({
        ...eulogy,
        written_at: formatWrittenDate(eulogy.created_at),
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    image_url: memorial.image_url || photos[0]?.image_url || '',
    lifespan: born || died ? `${born || 'Unknown'} - ${died || 'Present'}` : 'Dates not provided',
    donation_mpesa: memorial.donation_mpesa || '',
    donation_bank: memorial.donation_bank || '',
    donation_paypal: memorial.donation_paypal || '',
  };
}

function legacyEulogyToMemorial(eulogy) {
  const memorialId = eulogy.id ? `memorial-${eulogy.id}` : crypto.randomUUID();
  return {
    id: memorialId,
    full_name: eulogy.full_name,
    slug: eulogy.slug,
    born_on: eulogy.born_on,
    died_on: eulogy.died_on,
    image_url: eulogy.image_url || '',
    photos: eulogy.photos || [],
    summary: eulogy.summary,
    donation_mpesa: eulogy.donation_mpesa || '',
    donation_bank: eulogy.donation_bank || '',
    donation_paypal: eulogy.donation_paypal || '',
    eulogies: [
      {
        id: eulogy.id ? `entry-${eulogy.id}` : crypto.randomUUID(),
        memorial_id: memorialId,
        author_name: eulogy.author_name,
        story: eulogy.story,
        created_at: eulogy.created_at,
        published: eulogy.published,
      },
    ],
    created_at: eulogy.created_at,
    published: eulogy.published,
  };
}

function getLocalMemorials() {
  const stored = localStorage.getItem(memorialStorageKey);
  if (stored) {
    try {
      return JSON.parse(stored).map(withDisplayFields);
    } catch {
      localStorage.removeItem(memorialStorageKey);
    }
  }

  const legacyStored = localStorage.getItem(legacyStorageKey);
  if (legacyStored) {
    try {
      const migrated = JSON.parse(legacyStored).map(legacyEulogyToMemorial);
      localStorage.setItem(memorialStorageKey, JSON.stringify(migrated));
      return migrated.map(withDisplayFields);
    } catch {
      localStorage.removeItem(legacyStorageKey);
    }
  }

  localStorage.setItem(memorialStorageKey, JSON.stringify(starterMemorials));
  return starterMemorials.map(withDisplayFields);
}

function saveLocalMemorials(memorials) {
  localStorage.setItem(memorialStorageKey, JSON.stringify(memorials));
}

async function requestApi(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, options);

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(message || 'API request failed.');
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function requestSupabase(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const authorizationToken = data.session?.access_token || supabaseAnonKey;

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${authorizationToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    let errorMessage = message || 'Database request failed.';

    try {
      const parsed = JSON.parse(message);
      errorMessage = parsed.message || parsed.error_description || errorMessage;
    } catch {
      // Supabase usually returns JSON errors, but keep plain text if it does not.
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return [];
  }

  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function safeFileName(fileName) {
  const [name, extension = 'jpg'] = fileName.split(/\.(?=[^.]+$)/);
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'photo';
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  return `${safeName}.${safeExtension}`;
}

function publicStorageUrl(path) {
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(photoBucket)}/${encodePath(path)}`;
}

async function uploadPhotoFile(file, slug, position) {
  const { data } = await supabase.auth.getSession();
  const authorizationToken = data.session?.access_token || supabaseAnonKey;
  const path = `${slug}/${Date.now()}-${position}-${safeFileName(file.name)}`;
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(photoBucket)}/${encodePath(path)}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${authorizationToken}`,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: file,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Photo upload failed.');
  }

  return {
    image_url: publicStorageUrl(path),
    storage_path: path,
    caption: file.name,
    position,
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function createLocalPhoto(file, position) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${position}`,
    image_url: await readFileAsDataUrl(file),
    storage_path: '',
    caption: file.name,
    position,
  };
}

function getNewMemorialPhotoFiles(input) {
  return [input.cover_photo, ...(input.gallery_photos || [])].filter(Boolean);
}

function getAdditionalPhotoFiles(input) {
  return [...(input.gallery_photos || [])].filter(Boolean);
}

function appendFormValue(formData, name, value) {
  if (value !== undefined && value !== null) {
    formData.append(name, value);
  }
}

function createApiEulogyFormData(input, includeMemorialFields = false) {
  const formData = new FormData();

  if (includeMemorialFields) {
    appendFormValue(formData, 'full_name', input.full_name?.trim() || '');
    appendFormValue(formData, 'born_on', input.born_on || '');
    appendFormValue(formData, 'died_on', input.died_on || '');
    appendFormValue(formData, 'summary', input.summary?.trim() || '');
    appendFormValue(formData, 'donation_mpesa', input.donation_mpesa?.trim() || '');
    appendFormValue(formData, 'donation_bank', input.donation_bank?.trim() || '');
    appendFormValue(formData, 'donation_paypal', input.donation_paypal?.trim() || '');

    if (input.cover_photo) {
      formData.append('cover_photo', input.cover_photo);
    }
  }

  appendFormValue(formData, 'author_name', input.author_name?.trim() || '');
  appendFormValue(formData, 'story', input.story?.trim() || '');

  getAdditionalPhotoFiles(input).forEach((file) => {
    formData.append('gallery_photos', file);
  });

  return formData;
}

async function createApiEulogy(input) {
  const isExistingMemorial = input.memorial_id && input.memorial_id !== 'new';

  if (isExistingMemorial) {
    return withDisplayFields(await requestApi(`/api/memorials/${encodeURIComponent(input.memorial_id)}/eulogies`, {
      method: 'POST',
      body: createApiEulogyFormData(input),
    }));
  }

  return withDisplayFields(await requestApi('/api/memorials', {
    method: 'POST',
    headers: authHeaders(),
    body: createApiEulogyFormData(input, true),
  }));
}

function attachRelations(memorials, eulogies, photos) {
  return memorials.map((memorial) => withDisplayFields({
    ...memorial,
    eulogies: eulogies.filter((eulogy) => eulogy.memorial_id === memorial.id),
    photos: photos.filter((photo) => photo.memorial_id === memorial.id),
  }));
}

async function getSupabaseMemorials() {
  const [memorials, eulogies, photos] = await Promise.all([
    requestSupabase('memorials?select=*&published=eq.true&order=created_at.desc'),
    requestSupabase('eulogy_entries?select=*&published=eq.true&order=created_at.desc'),
    requestSupabase('memorial_photos?select=*&order=position.asc'),
  ]);

  return attachRelations(memorials, eulogies, photos);
}

export function makeSlug(value) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  return `${base || 'memorial'}-${Date.now().toString(36)}`;
}

export async function getMemorials() {
  if (hasApi) {
    const memorials = await requestApi('/api/memorials');
    return withoutDeletedMemorials(memorials.map(withDisplayFields));
  }

  if (hasDatabase) {
    return withoutDeletedMemorials(await getSupabaseMemorials());
  }

  return withoutDeletedMemorials(getLocalMemorials()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getMemorialBySlug(slug) {
  if (hasApi) {
    try {
      const memorial = await requestApi(`/api/memorials/${encodeURIComponent(slug)}`);

      if (!memorial || getDeletedMemorialIds().includes(memorial.id)) return null;

      return withDisplayFields(memorial);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  if (hasDatabase) {
    const rows = await requestSupabase(`memorials?select=*&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`);
    const memorial = rows[0];

    if (!memorial) return null;

    const [eulogies, photos] = await Promise.all([
      requestSupabase(`eulogy_entries?select=*&memorial_id=eq.${encodeURIComponent(memorial.id)}&published=eq.true&order=created_at.desc`),
      requestSupabase(`memorial_photos?select=*&memorial_id=eq.${encodeURIComponent(memorial.id)}&order=position.asc`),
    ]);

    if (getDeletedMemorialIds().includes(memorial.id)) return null;

    return withDisplayFields({ ...memorial, eulogies, photos });
  }

  return withoutDeletedMemorials(getLocalMemorials()).find((memorial) => memorial.slug === slug) || null;
}

export async function createEulogy(input) {
  const now = new Date().toISOString();
  const isExistingMemorial = input.memorial_id && input.memorial_id !== 'new';

  if (hasApi) {
    return createApiEulogy(input);
  }

  if (hasDatabase) {
    if (isExistingMemorial) {
      const rows = await requestSupabase(`memorials?select=*&id=eq.${encodeURIComponent(input.memorial_id)}&published=eq.true&limit=1`);
      const memorial = rows[0];
      if (!memorial) throw new Error('Memorial not found.');

      const uploadedPhotos = await Promise.all(getAdditionalPhotoFiles(input).map((file, index) => uploadPhotoFile(file, memorial.slug, index)));
      let photos = [];

      if (uploadedPhotos.length > 0) {
        photos = await requestSupabase('memorial_photos', {
          method: 'POST',
          body: JSON.stringify(uploadedPhotos.map((photo) => ({
            ...photo,
            memorial_id: memorial.id,
          }))),
        });
      }

      const eulogies = await requestSupabase('eulogy_entries', {
        method: 'POST',
        body: JSON.stringify({
          memorial_id: memorial.id,
          author_name: input.author_name.trim(),
          story: input.story.trim(),
          created_at: now,
          published: true,
        }),
      });

      return withDisplayFields({ ...memorial, photos, eulogies });
    }

    const slug = makeSlug(input.full_name);
    const { data: authData } = await supabase.auth.getSession();
    const creatorId = authData.session?.user?.id;

    if (!creatorId) {
      throw new Error('Please log in or create a creator account before creating a new memorial.');
    }

    const uploadedPhotos = await Promise.all(getNewMemorialPhotoFiles(input).map((file, index) => uploadPhotoFile(file, slug, index)));
    const memorialRows = await requestSupabase('memorials', {
      method: 'POST',
      body: JSON.stringify({
        full_name: input.full_name.trim(),
        slug,
        creator_account_id: creatorId,
        born_on: input.born_on || null,
        died_on: input.died_on || null,
        image_url: uploadedPhotos[0]?.image_url || '',
        summary: input.summary.trim(),
        donation_mpesa: input.donation_mpesa?.trim() || null,
        donation_bank: input.donation_bank?.trim() || null,
        donation_paypal: input.donation_paypal?.trim() || null,
        created_at: now,
        published: true,
      }),
    });
    const memorial = memorialRows[0];
    let photos = [];

    if (uploadedPhotos.length > 0) {
      photos = await requestSupabase('memorial_photos', {
        method: 'POST',
        body: JSON.stringify(uploadedPhotos.map((photo) => ({
          ...photo,
          memorial_id: memorial.id,
        }))),
      });
    }

    const eulogies = await requestSupabase('eulogy_entries', {
      method: 'POST',
      body: JSON.stringify({
        memorial_id: memorial.id,
        author_name: input.author_name.trim(),
        story: input.story.trim(),
        created_at: now,
        published: true,
      }),
    });

    return withDisplayFields({ ...memorial, photos, eulogies });
  }

  const memorials = getLocalMemorials();

  if (isExistingMemorial) {
    const memorialIndex = memorials.findIndex((memorial) => memorial.id === input.memorial_id);
    if (memorialIndex === -1) throw new Error('Memorial not found.');

    const memorial = memorials[memorialIndex];
    const newPhotos = await Promise.all(getAdditionalPhotoFiles(input).map((file, index) => createLocalPhoto(file, memorial.photos.length + index)));
    const newEulogy = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      memorial_id: memorial.id,
      author_name: input.author_name.trim(),
      story: input.story.trim(),
      created_at: now,
      published: true,
    };
    const updatedMemorial = {
      ...memorial,
      image_url: memorial.image_url || newPhotos[0]?.image_url || '',
      photos: [...memorial.photos, ...newPhotos],
      eulogies: [newEulogy, ...memorial.eulogies],
    };
    const nextMemorials = [...memorials];
    nextMemorials[memorialIndex] = updatedMemorial;
    saveLocalMemorials(nextMemorials);

    return withDisplayFields(updatedMemorial);
  }

  const slug = makeSlug(input.full_name);
  const memorialId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  const uploadedPhotos = await Promise.all(getNewMemorialPhotoFiles(input).map((file, index) => createLocalPhoto(file, index)));
  const localMemorial = {
    id: memorialId,
    full_name: input.full_name.trim(),
    slug,
    born_on: input.born_on || null,
    died_on: input.died_on || null,
    image_url: uploadedPhotos[0]?.image_url || '',
    photos: uploadedPhotos,
    summary: input.summary.trim(),
    donation_mpesa: input.donation_mpesa?.trim() || '',
    donation_bank: input.donation_bank?.trim() || '',
    donation_paypal: input.donation_paypal?.trim() || '',
    eulogies: [
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-eulogy`,
        memorial_id: memorialId,
        author_name: input.author_name.trim(),
        story: input.story.trim(),
        created_at: now,
        published: true,
      },
    ],
    created_at: now,
    published: true,
  };
  saveLocalMemorials([localMemorial, ...memorials]);

  return withDisplayFields(localMemorial);
}

export async function deleteEulogyEntry(memorialId, eulogyId) {
  if (!memorialId || !eulogyId) {
    throw new Error('Eulogy not found.');
  }

  if (hasApi) {
    await requestApi(`/api/memorials/${encodeURIComponent(memorialId)}/eulogies/${encodeURIComponent(eulogyId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return true;
  }

  if (hasDatabase) {
    await requestSupabase(`eulogy_entries?id=eq.${encodeURIComponent(eulogyId)}&memorial_id=eq.${encodeURIComponent(memorialId)}`, {
      method: 'DELETE',
    });
    return true;
  }

  const memorials = getLocalMemorials();
  const memorialIndex = memorials.findIndex((memorial) => memorial.id === memorialId);
  if (memorialIndex === -1) throw new Error('Memorial not found.');

  const memorial = memorials[memorialIndex];
  const updatedMemorial = {
    ...memorial,
    eulogies: memorial.eulogies.filter((eulogy) => eulogy.id !== eulogyId),
  };
  const nextMemorials = [...memorials];
  nextMemorials[memorialIndex] = updatedMemorial;
  saveLocalMemorials(nextMemorials);

  return true;
}

export async function deleteMemorialPhoto(memorialId, photoId) {
  if (!memorialId || !photoId || photoId === 'cover-photo') {
    throw new Error('Photo not found.');
  }

  if (hasApi) {
    await requestApi(`/api/memorials/${encodeURIComponent(memorialId)}/photos/${encodeURIComponent(photoId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return true;
  }

  if (hasDatabase) {
    const rows = await requestSupabase(`memorial_photos?select=storage_path&id=eq.${encodeURIComponent(photoId)}&memorial_id=eq.${encodeURIComponent(memorialId)}&limit=1`);
    const photo = rows[0];

    await requestSupabase(`memorial_photos?id=eq.${encodeURIComponent(photoId)}&memorial_id=eq.${encodeURIComponent(memorialId)}`, {
      method: 'DELETE',
    });

    if (photo?.storage_path) {
      await supabase.storage.from(photoBucket).remove([photo.storage_path]);
    }

    return true;
  }

  const memorials = getLocalMemorials();
  const memorialIndex = memorials.findIndex((memorial) => memorial.id === memorialId);
  if (memorialIndex === -1) throw new Error('Memorial not found.');

  const memorial = memorials[memorialIndex];
  const photoToDelete = memorial.photos.find((photo) => photo.id === photoId);
  const nextPhotos = memorial.photos.filter((photo) => photo.id !== photoId);
  const updatedMemorial = {
    ...memorial,
    photos: nextPhotos,
    image_url: memorial.image_url === photoToDelete?.image_url ? nextPhotos[0]?.image_url || '' : memorial.image_url,
  };
  const nextMemorials = [...memorials];
  nextMemorials[memorialIndex] = updatedMemorial;
  saveLocalMemorials(nextMemorials);

  return true;
}

export async function deleteMemorial(memorialId) {
  if (!memorialId) {
    throw new Error('Memorial not found.');
  }

  if (hasApi) {
    await requestApi(`/api/memorials/${encodeURIComponent(memorialId)}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    rememberDeletedMemorial(memorialId);
    return true;
  }

  if (hasDatabase) {
    const photos = await requestSupabase(`memorial_photos?select=storage_path&memorial_id=eq.${encodeURIComponent(memorialId)}`);
    const storagePaths = photos.map((photo) => photo.storage_path).filter(Boolean);

    await requestSupabase(`memorial_photos?memorial_id=eq.${encodeURIComponent(memorialId)}`, {
      method: 'DELETE',
    });
    await requestSupabase(`eulogy_entries?memorial_id=eq.${encodeURIComponent(memorialId)}`, {
      method: 'DELETE',
    });
    await requestSupabase(`memorials?id=eq.${encodeURIComponent(memorialId)}`, {
      method: 'DELETE',
    });

    if (storagePaths.length > 0) {
      await supabase.storage.from(photoBucket).remove(storagePaths);
    }

    rememberDeletedMemorial(memorialId);
    return true;
  }

  saveLocalMemorials(getLocalMemorials().filter((memorial) => memorial.id !== memorialId));
  rememberDeletedMemorial(memorialId);

  return true;
}

export const getEulogies = getMemorials;
export const getEulogyBySlug = getMemorialBySlug;





