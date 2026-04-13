import { FileItem, Sample, ShareLink, User, Project } from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'aims.token';

type AuthUser = {
  id: string;
  username: string;
  name?: string;
  email?: string;
  role: User['role'];
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const jsonFetch = async <T>(path: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json() as Promise<T>;
};

const formFetch = async <T>(path: string, body: FormData, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    method: options.method || 'POST',
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    },
    body
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json() as Promise<T>;
};

export const api = {
  async login(username: string, password: string) {
    const data = await jsonFetch<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    setToken(data.token);
    return data.user;
  },

  async fetchProjects() {
    return jsonFetch<Project[]>('/projects');
  },

  async fetchProject(id: string) {
    return jsonFetch<Project>(`/projects/${id}`);
  },

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    return jsonFetch<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    });
  },

  async updateProject(id: string, updates: Partial<Project>) {
    return jsonFetch<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async deleteProject(id: string) {
    return jsonFetch<{ ok: boolean }>(`/projects/${id}`, { method: 'DELETE' });
  },

  async fetchUsers() {
    return jsonFetch<User[]>('/users');
  },

  async createUser(payload: { username: string; password: string; role: User['role']; name?: string; email?: string; }) {
    return jsonFetch<User>('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateUser(id: string, updates: Partial<User> & { password?: string }) {
    return jsonFetch<{ ok: boolean }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async deleteUser(id: string) {
    return jsonFetch<{ ok: boolean }>(`/users/${id}`, { method: 'DELETE' });
  },

  async fetchSamples() {
    return jsonFetch<Sample[]>('/samples');
  },

  async createSample(sample: Omit<Sample, 'id'>) {
    return jsonFetch<Sample>('/samples', {
      method: 'POST',
      body: JSON.stringify(sample)
    });
  },

  async updateSample(id: string, updates: Partial<Sample>) {
    return jsonFetch<Sample>(`/samples/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async fetchFiles() {
    return jsonFetch<FileItem[]>('/files');
  },

  async uploadFile(file: File, metadata: Partial<FileItem> & { sampleId?: string } = {}) {
    const body = new FormData();
    body.append('files', file);
    if (metadata.sampleId) body.append('sampleId', metadata.sampleId);
    if (metadata.folderPath) body.append('folderPath', metadata.folderPath);
    if (metadata.uploadedBy) body.append('uploadedBy', metadata.uploadedBy);
    if (metadata.isOverlay !== undefined) body.append('isOverlay', String(metadata.isOverlay));
    if (metadata.overlayId) body.append('overlayId', metadata.overlayId);
    if (metadata.thumbnail) body.append('thumbnail', metadata.thumbnail);
    if (metadata.linkedSampleIds) body.append('linkedSampleIds', JSON.stringify(metadata.linkedSampleIds));
    const result = await formFetch<FileItem[]>('/files', body);
    return result[0];
  },

  async updateFile(id: string, updates: Partial<FileItem> & { linkedSampleIds?: string[]; sampleId?: string }) {
    return jsonFetch<{ ok: boolean }>(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  async deleteFile(id: string) {
    return jsonFetch<{ ok: boolean }>(`/files/${id}`, { method: 'DELETE' });
  },

  async fetchShares() {
    return jsonFetch<ShareLink[]>('/shares');
  },

  async createShare(payload: Omit<ShareLink, 'id' | 'url' | 'createdAt' | 'views'>) {
    return jsonFetch<{ token: string; url: string }>('/shares', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async deleteShare(id: string) {
    return jsonFetch<{ ok: boolean }>(`/shares/${id}`, { method: 'DELETE' });
  }
};
