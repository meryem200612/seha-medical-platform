function cleanUrl(url) {
  return url.replace(/\/+$/, '');
}

export const FRONTEND_URL = cleanUrl(import.meta.env.FRONTEND_URL);
export const API_ORIGIN = cleanUrl(import.meta.env.BACKEND_URL);
export const API_BASE_URL = `${API_ORIGIN}/api`;

export function storageUrl(path) {
  if (!path) return null;
  return `${API_ORIGIN}/storage/${path.replace(/^\//, '')}`;
}
