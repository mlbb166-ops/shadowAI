export type ApiRecord = Record<string, unknown>;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {};
}

export function asList(value: unknown): ApiRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

export function text(value: unknown, fallback = '—'): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

export function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function booleanValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers, credentials: 'include' });
  } catch {
    throw new ApiError('Layanan belum dapat dihubungi. Pastikan server backend sedang berjalan.', 0);
  }

  let body: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const data = asRecord(body);
    const detail = data.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && typeof asRecord(detail[0]).msg === 'string'
        ? text(asRecord(detail[0]).msg, 'Data yang dimasukkan belum sesuai.')
        : typeof data.message === 'string'
        ? data.message
        : `Permintaan gagal (${response.status}). Silakan coba lagi.`;
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export async function waitForAgentJob(jobId: string, timeoutMs = 90000): Promise<ApiRecord> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const payload = asRecord(await endpoints.job(jobId));
    const job = asRecord(payload.job);
    if (["completed", "failed", "blocked"].includes(text(job.status, ""))) return job;
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  throw new ApiError("Agent masih memproses permintaan. Buka kembali pusat agent untuk melihat statusnya.", 408);
}

export const endpoints = {
  me: () => api('/auth/me'),
  login: (email: string, password: string) =>
    api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string, acceptDataProcessing: boolean) =>
    api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ display_name: name, email, password, accept_data_processing: acceptDataProcessing }),
    }),
  logout: () => api('/auth/logout', { method: 'POST' }),
  dashboard: () => api('/dashboard'),
  children: () => api('/children'),
  createChild: (payload: ApiRecord) => api('/children', { method: 'POST', body: JSON.stringify(payload) }),
  createMeasurement: (payload: ApiRecord) => api('/measurements', { method: 'POST', body: JSON.stringify(payload) }),
  chat: (payload: ApiRecord) => api('/agents/chat', { method: 'POST', body: JSON.stringify(payload) }),
  agentRuns: () => api('/agents/runs'),
  job: (id: string) => api(`/agents/jobs/${encodeURIComponent(id)}`),
  foods: (query: string) => api(`/foods/search?q=${encodeURIComponent(query)}&limit=12`),
  publicFoodStats: () => api('/public/food-stats'),
  architecture: () => api('/public/architecture'),
  telegramStatus: () => api('/telegram/status'),
  telegramCode: (childId?: string) => api('/telegram/link-code', {
    method: 'POST',
    body: JSON.stringify(childId ? { child_id: childId } : {}),
  }),
  telegramUnlink: () => api('/telegram/unlink', { method: 'POST' }),
};
