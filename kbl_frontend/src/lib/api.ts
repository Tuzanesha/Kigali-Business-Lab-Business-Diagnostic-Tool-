// api.ts — Clean, Docker-aware API client for Next.js + Django (JWT)
// ===================================================================

export type JwtPair = { access: string; refresh: string };

// -------------------------------------------------------------------
// Base URL selection (browser vs server)
const getApiBaseUrl = () => {
  // Production: Use environment variable (set in Render)
  // Development: Use localhost URLs
  if (typeof window !== "undefined") {
    // Browser environment
    // Check for production API URL first
    const prodUrl = process.env.NEXT_PUBLIC_API_URL;
    if (prodUrl) {
      // Ensure /api is included if not already present
      const url = prodUrl.endsWith('/api') ? prodUrl : `${prodUrl.replace(/\/+$/, '')}/api`;
      return url;
    }
    
    // Development: use direct backend URL to bypass proxy/nginx HTTPS issues
    // Backend routes are under /api/ prefix, so include it
    const directUrl = "http://localhost:8000/api";
    return directUrl;
  } else {
    // Server-side rendering
    // Production: Use environment variable
    const prodUrl = process.env.NEXT_PUBLIC_API_URL;
    if (prodUrl) {
      // Ensure /api is included if not already present
      return prodUrl.endsWith('/api') ? prodUrl : `${prodUrl.replace(/\/+$/, '')}/api`;
    }
    
    // Development: use direct backend URL (no /api needed for internal calls)
    const url = process.env.NEXT_PUBLIC_API_URL_SERVER || "http://web:8000";
    return url;
  }
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // eslint-disable-next-line no-console
  console.log("API_BASE_URL configured as:", API_BASE_URL);
}

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

// -------------------------------------------------------------------
// Low-level fetch wrapper
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string
): Promise<T> {
  // Clean and construct URL properly
  let baseUrl = API_BASE_URL.replace(/\/+$/, ""); // Remove trailing slashes
  // Ensure baseUrl ends with /api if it should
  if (!baseUrl.includes("/api") && (baseUrl.includes("localhost:8085") || baseUrl.includes("127.0.0.1:8085"))) {
    baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    baseUrl = `${baseUrl}/api`;
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`Added missing /api prefix. New baseUrl: ${baseUrl}`);
    }
  }
  
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = `${baseUrl}/${cleanEndpoint}`;

  // Debug logging in development
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`API Fetch: ${options.method || "GET"} ${url}`);
  }

  // Ensure URL is valid and uses correct protocol - ALWAYS force HTTP for localhost
  let finalUrl: string;
  try {
    const urlObj = new URL(url);
    // Force HTTP for localhost in development to avoid SSL issues
    if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1") {
      urlObj.protocol = "http:";
      // Ensure port is included
      if (!urlObj.port && urlObj.hostname === "localhost") {
        // Port is already in host, so just reconstruct
        finalUrl = `http://${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      } else {
        finalUrl = `http://${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      }
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(`Forced HTTP for localhost. Final URL: ${finalUrl}`);
      }
    } else {
      finalUrl = url;
    }
  } catch (e) {
    // If URL construction fails, use the original string but ensure HTTP for localhost
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      finalUrl = url.replace(/^https:\/\//i, "http://");
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(`Changed HTTPS to HTTP for localhost (fallback): ${finalUrl}`);
      }
    } else {
      finalUrl = url;
    }
  }

  // Final safety check: Ensure HTTP protocol for localhost
  if (finalUrl.includes("localhost:8085") && finalUrl.startsWith("https://")) {
    finalUrl = finalUrl.replace(/^https:\/\//, "http://");
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`Final safety check: Forced HTTP protocol. URL: ${finalUrl}`);
    }
  }

  // Debug: Log final URL before fetch
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`About to fetch: ${finalUrl}`);
  }

  const headers = new Headers({
    ...defaultHeaders,
    ...(options.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  });

  if (options.body instanceof FormData) {
    headers.delete("Content-Type");
  }

  // Ensure finalUrl is an absolute URL and contains /api for localhost:8085
  if (finalUrl.includes("localhost:8085") && !finalUrl.includes("/api")) {
    // Insert /api after the host
    finalUrl = finalUrl.replace(/^(http:\/\/localhost:8085)(\/|$)/, "http://localhost:8085/api/");
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`Added missing /api prefix to final URL: ${finalUrl}`);
    }
  }

  // Ensure the URL is absolutely correct before fetch
  // Final verification: URL must contain /api and use http://
  if (finalUrl.includes("localhost:8085")) {
    if (!finalUrl.startsWith("http://localhost:8085/api")) {
      // Reconstruct the URL properly
      const urlMatch = finalUrl.match(/^https?:\/\/localhost:8085(.*)$/);
      if (urlMatch) {
        finalUrl = `http://localhost:8085/api${urlMatch[1]}`;
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.warn(`Reconstructed URL to ensure /api prefix: ${finalUrl}`);
        }
      }
    }
  }

  // Verify fetch hasn't been overridden/intercepted
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`Fetching with final URL string: ${finalUrl}`);
    // Check if fetch has been modified
    if ((window as any).__originalFetch) {
      // eslint-disable-next-line no-console
      console.warn("WARNING: fetch may have been overridden!");
    }
  }

  // Create fetch options ensuring URL stays correct
  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers,
    mode: "cors",
    credentials: "omit",
    ...options,
    // Override body if it was in options
    body: options.body,
  };

  // Use native fetch with the exact URL string
  const response = await fetch(finalUrl, fetchOptions);
  
  // Verify the response URL matches what we expected
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development" && response.url) {
    if (response.url !== finalUrl && !response.url.includes("/api")) {
      // eslint-disable-next-line no-console
      console.error(`URL MISMATCH! Expected: ${finalUrl}, Response URL: ${response.url}`);
    }
  }

  if (response.status === 204) return null as T;

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
// Simple connectivity test (tries the configured API_BASE_URL health endpoint)
export const testApiConnection = async (): Promise<{ connected: boolean; url: string; error?: string }> => {
  try {
    const healthUrl = `${API_BASE_URL.replace(/\/+$/, "")}/health/`;
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
