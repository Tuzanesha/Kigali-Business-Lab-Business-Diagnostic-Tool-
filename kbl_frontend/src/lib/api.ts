// api.ts — Clean API client for Next.js + Django (JWT)
// Works for both development (localhost) and production (Render)
// ===================================================================

export type JwtPair = { access: string; refresh: string };

// -------------------------------------------------------------------
// Base URL selection - SIMPLIFIED for reliability
const getApiBaseUrl = (): string => {
  // 1. Check for environment variable (set in production or docker-compose)
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (envUrl) {
    // Production or explicitly configured
    // Ensure URL ends with /api
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  
  // 2. Development fallback - use direct backend URL (port 8000)
  // This avoids proxy/nginx issues on macOS Docker
  return "http://localhost:8000/api";
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging in development (browser only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[API] Base URL:", API_BASE_URL);
}

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

// -------------------------------------------------------------------
// Low-level fetch wrapper - SIMPLIFIED
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  // Build URL
  const baseUrl = API_BASE_URL.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  const url = `${baseUrl}/${cleanEndpoint}`;

  // Debug logging
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log(`[API] ${options.method || "GET"} ${url}`);
  }

  // Build headers
  const headers = new Headers({
    ...defaultHeaders,
    ...(options.headers || {}),
  });
  
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    headers.delete("Content-Type");
  }

  // Make the request
  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    mode: "cors",
    credentials: "omit",
    body: options.body,
  });

  // Handle 204 No Content
  if (response.status === 204) return null as T;

  // Parse response
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data.detail || data.message || "API request failed");
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data as T;
}

// -------------------------------------------------------------------
// Simple helpers for HTTP verbs
const apiGet = <T = any>(endpoint: string, accessToken?: string) =>
  apiFetch<T>(endpoint, { method: "GET" }, accessToken);

const apiPost = <T = any>(endpoint: string, body?: any, accessToken?: string) =>
  apiFetch<T>(
    endpoint,
    {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    },
    accessToken
  );

const apiPut = <T = any>(endpoint: string, body?: any, accessToken?: string) =>
  apiFetch<T>(
    endpoint,
    {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    },
    accessToken
  );

const apiPatch = <T = any>(endpoint: string, body?: any, accessToken?: string) =>
  apiFetch<T>(
    endpoint,
    {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body || {}),
    },
    accessToken
  );

const apiDelete = <T = any>(endpoint: string, accessToken?: string) =>
  apiFetch<T>(endpoint, { method: "DELETE" }, accessToken);

// -------------------------------------------------------------------
// Auth helpers (refresh token handling)
export const refreshAuthToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const data = await apiPost<{ access: string }>("auth/refresh/", { refresh: refreshToken });
    if (data?.access) {
      localStorage.setItem("accessToken", data.access);
      return data.access;
    }
  } catch (e) {
    // refresh failed — clear tokens
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
  return null;
};

// Utility to get access token consistently (handles both 'accessToken' and 'access' for backward compatibility)
export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  // Check for 'accessToken' first (new standard), then fall back to 'access' (old)
  return localStorage.getItem("accessToken") || localStorage.getItem("access");
};

// Utility to set API base URL programmatically (debugging)
let mutableApiBase = API_BASE_URL;
export const setApiBaseUrl = (url: string) => {
  mutableApiBase = url.replace(/\/+$/, "");
  // eslint-disable-next-line no-console
  console.log("Manually set API base URL to:", mutableApiBase);
};

// If you want to use mutableApiBase instead of API_BASE_URL, swap usages above.
// For simplicity we've used the env-based API_BASE_URL constant.

// -------------------------------------------------------------------
// High-level API groups (auth, profile, team, enterprise, etc.)
// Mirror of your previous API endpoints, simplified and stable.
// -------------------------------------------------------------------

export const authApi = {
  login: (email: string, password: string) =>
    apiPost<JwtPair>("auth/login/", { email, password }),

  register: (fullName: string, email: string, password: string, phone?: string) =>
    apiPost<{ id: number; email: string; detail?: string; email_sent?: boolean; warning?: string }>(
      "auth/register/",
      { full_name: fullName, email, password, phone }
    ),

  logout: (refresh?: string) =>
    apiPost("auth/logout/", refresh ? { refresh } : {}),

  status: (access: string) => apiGet<{ verified?: boolean }>("auth/status/", access),

  passwordResetRequest: (email: string) =>
    apiPost("auth/password-reset/request/", { email }),

  passwordResetConfirm: (uid: string, token: string, new_password: string) =>
    apiPost("auth/password-reset/confirm/", { uid, token, new_password }),

  resendVerification: (email: string) =>
    apiPost("auth/resend-verification-email/", { email }),

  verifyEmail: (code: string) => apiPost("auth/verify-otp/", { code }),
};

export const profileApi = {
  get: (access: string) => apiGet("account/profile/", access),
  update: (access: string, payload: any) => apiPut("account/profile/", payload, access),
  changePassword: (access: string, current_password: string, new_password: string, confirm_password: string) =>
    apiPost("account/password/change/", { current_password, new_password, confirm_password }, access),
  deleteAccount: (access: string) => apiPost("account/delete/", { confirm: "yes" }, access),
  uploadAvatar: (access: string, file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return apiPost("account/avatar/upload/", fd, access);
  },
  removeAvatar: (access: string) => apiPost("account/avatar/remove/", {}, access),
  logout: (refreshToken: string) => authApi.logout(refreshToken),
};

export const teamApi = {
  list: (access: string) => apiGet("team/", access),
  create: (access: string, payload: { enterprise: number; email: string; role?: string }) => apiPost("team/", payload, access),
  update: (access: string, id: number, payload: any) => apiPatch(`team/${id}/`, payload, access),
  delete: (access: string, id: number) => apiDelete(`team/${id}/`, access),
  
  // Invitation endpoints
  getInvitation: (token: string) => apiGet(`team/accept/?token=${encodeURIComponent(token)}`),
  acceptInvite: (payload: { token: string; password?: string; confirm_password?: string; full_name?: string }) => 
    apiPost("team/accept/", payload),
  
  // Team member portal
  getPortal: (access: string) => apiGet("team-portal/", access),
  getEnterpriseMembers: (access: string, enterpriseId: number) => 
    apiGet(`enterprise/${enterpriseId}/team-members/`, access),
};

export const enterpriseApi = {
  list: (access: string) => apiGet("enterprises/", access),
  create: (access: string, payload: any) => apiPost("enterprises/", payload, access),
  getProfile: (access: string, id?: number) =>
    apiGet(id ? `enterprise/${id}/profile/` : "enterprise/profile/", access),
  updateProfile: (access: string, payload: any, id?: number) =>
    apiPut(id ? `enterprise/${id}/profile/` : "enterprise/profile/", payload, access),
  submitAnswers: (access: string, enterpriseId: number, answers: any[]) =>
    apiPost(`enterprises/${enterpriseId}/bulk-answers/`, answers, access),
  recompute: (access: string, enterpriseId: number) => apiPost(`enterprises/${enterpriseId}/recompute/`, {}, access),
  resetResponses: (access: string, enterpriseId: number) => apiPost(`enterprises/${enterpriseId}/reset-responses/`, {}, access),
  getReport: (access: string, id: number) => apiGet(`enterprise/${id}/report/`, access),
};

export const assessmentApi = {
  getSummaries: (access: string) => apiGet("my/enterprises-summaries/", access),
  getStats: (access: string) => apiGet("my/assessment-stats/", access),
  getSessions: (access: string) => apiGet("my/assessment-sessions/", access),
  deleteSession: (access: string, sessionId: number) => apiDelete(`assessment-sessions/${sessionId}/`, access),
};

export const catalogApi = {
  getCategories: (access: string) => apiGet("categories/", access),
  getQuestions: (access: string, params?: { category?: string }) => {
    const query = params?.category ? `?category=${encodeURIComponent(params.category)}` : "";
    return apiGet(`questions/${query}`, access);
  },
  // Optimized endpoint that returns ALL questions grouped by category in a single request
  getAllQuestions: (access: string) => apiGet<{
    questions_by_category: Record<string, any[]>;
    total_questions: number;
    categories: string[];
    message?: string;
  }>("questions/all/", access),
};

export const dashboardApi = {
  getDashboard: (access: string) => apiGet("dashboard/", access),
};

export const notificationsApi = {
  get: (access: string) => apiGet("account/notifications/", access),
  update: (access: string, payload: any) => apiPut("account/notifications/", payload, access),
  test: (access: string) => apiPost("account/notifications/test/", {}, access),
};

export const actionItemApi = {
  getBoard: (access: string) => apiGet("action-items/board/", access),
  create: (access: string, payload: any) => apiPost("action-items/", payload, access),
  bulkMove: (access: string, items: Array<{ id: number; status: "todo" | "inprogress" | "completed"; order: number }>) =>
    apiPost("action-items/bulk-move/", { items }, access),
  
  // Detail and progress
  getDetail: (access: string, id: number) => apiGet(`action-items/${id}/detail/`, access),
  updateProgress: (access: string, id: number, payload: { progress_percentage?: number; status?: string; note?: string }) =>
    apiPost(`action-items/${id}/progress/`, payload, access),
  addNote: (access: string, id: number, content: string, progressUpdate?: number) =>
    apiPost(`action-items/${id}/notes/`, { content, progress_update: progressUpdate }, access),
  uploadDocument: (access: string, id: number, file: File, description?: string) => {
    const fd = new FormData();
    fd.append("file", file);
    if (description) fd.append("description", description);
    return apiPost(`action-items/${id}/documents/`, fd, access);
  },
  assign: (access: string, id: number, userId: number | null) =>
    apiPost(`action-items/${id}/assign/`, { user_id: userId }, access),
  
  // Enterprise action items
  getEnterpriseItems: (access: string, enterpriseId: number) =>
    apiGet(`enterprise/${enterpriseId}/action-items/`, access),
};

export const verificationApi = {
  checkVerificationStatus: (access: string) => apiGet("auth/status/", access),
  resendVerification: (email: string) => apiPost("auth/resend-verification-email/", { email }),
};

// -------------------------------------------------------------------
// Simple connectivity test (tries the configured API base)
export const testApiConnection = async (): Promise<{ connected: boolean; url: string; error?: string }> => {
  try {
    // Try the health endpoint (without /api since it's at root)
    const baseWithoutApi = API_BASE_URL.replace(/\/api\/?$/, '');
    const healthUrl = `${baseWithoutApi}/health/`;
    const res = await fetch(healthUrl, { method: "GET" });
    if (res.ok) return { connected: true, url: API_BASE_URL };
    return { connected: false, url: API_BASE_URL, error: `Health returned ${res.status}` };
  } catch (err: any) {
    return { connected: false, url: API_BASE_URL, error: err?.message || String(err) };
  }
};

// -------------------------------------------------------------------
// Auth status utility used by client code
export const checkAuth = async (): Promise<{ isAuthenticated: boolean; needsVerification?: boolean }> => {
  if (typeof window === "undefined") return { isAuthenticated: false };
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return { isAuthenticated: false };
  try {
    const status = await authApi.status(accessToken);
    return { isAuthenticated: true, needsVerification: !status?.verified };
  } catch (e) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return { isAuthenticated: false };
  }
};

// -------------------------------------------------------------------
// Export everything together for convenience
export const api = {
  ...authApi,
  ...profileApi,
  ...teamApi,
  ...enterpriseApi,
  ...assessmentApi,
  ...catalogApi,
  ...dashboardApi,
  ...notificationsApi,
  ...actionItemApi,
  ...verificationApi,
  refreshAuthToken,
  testApiConnection,
  setApiBaseUrl,
};

export default api;
