const DEFAULT_API_BASE_URL = 'https://capstone.dpdns.org';

const trimSlashes = (value = '') => value.replace(/\/+$/, '');
const trimLeadingSlash = (value = '') => value.replace(/^\/+/, '');
const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(value) || /^wss?:\/\//i.test(value);

export const API_BASE = trimSlashes(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL);
export const WS_BASE = trimSlashes(
  import.meta.env.VITE_WS_BASE_URL || API_BASE.replace(/^http/i, 'ws')
);

console.log('🔧 API Configuration:', { API_BASE, WS_BASE, env: import.meta.env.VITE_API_BASE_URL });

export const getToken = () => localStorage.getItem('icu_token');

export const resolveServiceUrl = (baseUrl, pathOrUrl) => {
  if (!pathOrUrl) return trimSlashes(baseUrl);
  if (isAbsoluteUrl(pathOrUrl)) return pathOrUrl;
  return `${trimSlashes(baseUrl)}/${trimLeadingSlash(pathOrUrl)}`;
};

const parseErrorMessage = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const json = await response.json().catch(() => ({}));
    return json.detail || json.message || json.error || `Request failed: ${response.status}`;
  }

  const text = await response.text().catch(() => '');
  return text || `Request failed: ${response.status}`;
};

export async function requestJson(pathOrUrl, options = {}, config = {}) {
  const { baseUrl = API_BASE, includeAuth = true } = config;
  const token = includeAuth ? getToken() : null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const fullUrl = resolveServiceUrl(baseUrl, pathOrUrl);

  console.log(`🌐 API Request: ${options.method || 'GET'} ${fullUrl}`);

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorMsg = await parseErrorMessage(response);
    console.error(`❌ API Error (${response.status}): ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export const apiFetch = (path, options = {}) => requestJson(path, options);
