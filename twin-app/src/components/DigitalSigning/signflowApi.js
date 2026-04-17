const trimTrailingSlashes = (value = '') => value.replace(/\/+$/, '');

export const SIGNFLOW_API_BASE = trimTrailingSlashes(
  import.meta.env.VITE_SIGNFLOW_API_URL || '/signflow/api'
);

export const SIGNFLOW_PUBLIC_BASE = trimTrailingSlashes(
  import.meta.env.VITE_SIGNFLOW_PUBLIC_URL || SIGNFLOW_API_BASE.replace(/\/api$/, '')
);

export const SIGNFLOW_STORAGE_KEYS = {
  token: 'signflow_token',
  user: 'signflow_user',
};

let resolvedSignflowApiBase = null;
let resolvedSignflowPublicBase = null;

export const getSignflowToken = () => localStorage.getItem(SIGNFLOW_STORAGE_KEYS.token);

export const getStoredSignflowUser = () => {
  try {
    return JSON.parse(localStorage.getItem(SIGNFLOW_STORAGE_KEYS.user) || 'null');
  } catch {
    return null;
  }
};

export const persistSignflowSession = (token, user) => {
  localStorage.setItem(SIGNFLOW_STORAGE_KEYS.token, token);
  localStorage.setItem(SIGNFLOW_STORAGE_KEYS.user, JSON.stringify(user));
};

export const clearSignflowSession = () => {
  localStorage.removeItem(SIGNFLOW_STORAGE_KEYS.token);
  localStorage.removeItem(SIGNFLOW_STORAGE_KEYS.user);
};

const isLocalBrowser = () =>
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const pushUnique = (list, value) => {
  if (value && !list.includes(value)) {
    list.push(value);
  }
};

const resolvePublicBaseFromApi = (apiBase) => trimTrailingSlashes(String(apiBase).replace(/\/api$/, ''));

const getActiveApiBase = () => resolvedSignflowApiBase || SIGNFLOW_API_BASE;
const getActivePublicBase = () => resolvedSignflowPublicBase || SIGNFLOW_PUBLIC_BASE;

const getApiCandidates = () => {
  const candidates = [];

  pushUnique(candidates, resolvedSignflowApiBase);
  pushUnique(candidates, SIGNFLOW_API_BASE);

  if (
    isLocalBrowser() &&
    typeof window !== 'undefined' &&
    !import.meta.env.VITE_SIGNFLOW_API_URL
  ) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const currentPort = Number(window.location.port || (protocol === 'https:' ? 443 : 80));

    if (Number.isFinite(currentPort) && currentPort > 0) {
      for (let offset = -2; offset <= 6; offset += 1) {
        const candidatePort = currentPort + offset;
        if (candidatePort > 0) {
          pushUnique(candidates, `${protocol}//${hostname}:${candidatePort}/signflow/api`);
        }
      }
    }

    pushUnique(candidates, 'http://localhost:4000/api');
    pushUnique(candidates, 'http://127.0.0.1:4000/api');
  }

  return candidates;
};

const parseErrorMessage = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => ({}));
    return payload.error || payload.message || payload.detail || `Request failed: ${response.status}`;
  }

  const text = await response.text().catch(() => '');
  return text || `Request failed: ${response.status}`;
};

export async function signflowRequest(path, options = {}, config = {}) {
  const { includeAuth = true, expect = 'json' } = config;
  const token = includeAuth ? getSignflowToken() : null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const candidates = getApiCandidates();
  let lastError = null;

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401 && includeAuth) {
          clearSignflowSession();
        }

        const error = new Error(await parseErrorMessage(response));
        error.status = response.status;
        lastError = error;

        if (response.status === 404 && baseUrl !== candidates[candidates.length - 1]) {
          continue;
        }

        throw error;
      }

      if (response.status === 204) return null;

      resolvedSignflowApiBase = trimTrailingSlashes(baseUrl);
      resolvedSignflowPublicBase = resolvePublicBaseFromApi(baseUrl);

      if (expect === 'text') {
        return response.text();
      }

      return response.json();
    } catch (error) {
      lastError = error;

      if (baseUrl !== candidates[candidates.length - 1]) {
        continue;
      }
    }
  }

  if (lastError?.status === 404 || lastError instanceof TypeError) {
    throw new Error('SignFlow service is unavailable. Open the URL printed by npm run dev and try again.');
  }

  throw lastError;
}

export const signflowLogin = (email, password) =>
  signflowRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, { includeAuth: false });

export const signflowRegister = (payload) =>
  signflowRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, { includeAuth: false });

export const signflowMe = () => signflowRequest('/auth/me');

export const buildProtectedDocumentUrl = (documentId) => {
  const token = getSignflowToken();
  return `${getActivePublicBase()}/api/documents/${documentId}/file?token=${encodeURIComponent(token || '')}`;
};

export const buildInviteDocumentUrl = (inviteToken) =>
  `${getActivePublicBase()}/api/documents/invite/${inviteToken}/file`;

export const buildUploadedAssetUrl = (path = '') =>
  `${getActivePublicBase()}/uploads/${String(path).replace(/^\/+/, '')}`;
