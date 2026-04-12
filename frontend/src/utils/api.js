const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';

async function handle(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error(`Le serveur ne répond pas (timeout ${ms / 1000}s).`);
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export async function uploadPdp(file, scenarioName) {
  const form = new FormData();
  form.append('file', file);
  if (scenarioName) form.append('name', scenarioName);
  const res = await fetchWithTimeout(
    `${API_BASE}/pdp/upload`,
    { method: 'POST', body: form },
    60000
  );
  return handle(res);
}

export async function listPdps() {
  const res = await fetchWithTimeout(`${API_BASE}/pdps`, {}, 5000);
  return handle(res);
}

export async function getPdp(id) {
  const res = await fetchWithTimeout(`${API_BASE}/pdp/${id}`, {}, 8000);
  return handle(res);
}

export async function deletePdp(id) {
  const res = await fetchWithTimeout(
    `${API_BASE}/pdp/${id}`,
    { method: 'DELETE' },
    5000
  );
  return handle(res);
}
