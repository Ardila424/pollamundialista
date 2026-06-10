// ============================================
// API Client — wrapper sobre fetch
// ============================================

const API_BASE = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Token inválido → auto-logout
      this.token = null;
      localStorage.removeItem('token');
      window.location.reload();
      throw new Error('Sesión expirada');
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}`);
    }

    return data as T;
  }

  // ---- Auth ----
  async login(username: string, pin: string) {
    const data = await this.request<{
      token: string;
      user: { id: number; username: string };
      isNewUser: boolean;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, pin }),
    });
    this.token = data.token;
    return data;
  }

  // ---- Matches ----
  async getMatches(filters?: { phase?: string; date?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.phase) params.set('phase', filters.phase);
    if (filters?.date) params.set('date', filters.date);
    if (filters?.status) params.set('status', filters.status);
    const query = params.toString();
    return this.request<any[]>(`/matches${query ? `?${query}` : ''}`);
  }

  async getPhases() {
    return this.request<string[]>('/matches/phases');
  }

  // ---- Predictions ----
  async savePrediction(matchId: number, prediction: string) {
    return this.request<{ message: string; prediction: any }>('/predictions', {
      method: 'POST',
      body: JSON.stringify({ matchId, prediction }),
    });
  }

  async deletePrediction(matchId: number) {
    return this.request<{ message: string }>(`/predictions/${matchId}`, {
      method: 'DELETE',
    });
  }

  async getMyPredictions() {
    return this.request<{
      predictions: any[];
      stats: {
        total: number;
        finished: number;
        correct: number;
        points: number;
        accuracy: number;
      };
    }>('/predictions/me');
  }

  // ---- Leaderboard ----
  async getLeaderboard() {
    return this.request<any[]>('/leaderboard');
  }

  async getGroupStandings() {
    return this.request<any[]>('/groups');
  }
}

export const api = new ApiClient();
export default api;
