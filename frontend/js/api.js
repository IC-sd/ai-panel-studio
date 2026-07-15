/* API client for communicating with the backend. */

const API_BASE = '/api';

async function apiRequest(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const api = {
  // Discussions
  listDiscussions: () => apiRequest('GET', '/discussions'),
  getDiscussion: (id) => apiRequest('GET', `/discussions/${id}`),
  createDiscussion: (topic, expertCount) =>
    apiRequest('POST', '/discussions', { topic, expert_count: expertCount }),
  startDiscussion: (id) => apiRequest('POST', `/discussions/${id}/start`),
  pauseDiscussion: (id) => apiRequest('POST', `/discussions/${id}/pause`),
  resumeDiscussion: (id) => apiRequest('POST', `/discussions/${id}/resume`),
  deleteDiscussion: (id) => apiRequest('DELETE', `/discussions/${id}`),
};
