export type JwtPair = { access: string; refresh: string };

const defaultHeaders = {
  'Content-Type': 'application/json',
};

export async function apiLogin(email: string, password: string): Promise<JwtPair> {
  const res = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let detail = 'Login failed';
    try {
      const j = await res.json();
      detail = j?.detail || JSON.stringify(j);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiMySummaries(access: string) {
  const res = await fetch('/api/my/enterprises-summaries/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load summaries';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiEnterpriseReport(access: string, id: number) {
  const res = await fetch(`/api/enterprise/${id}/report/`, {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load report';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiProfileGet(access: string) {
  const res = await fetch('/api/account/profile/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load profile';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiProfileUpdate(access: string, payload: any) {
  const res = await fetch('/api/account/profile/', {
    method: 'PUT',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = 'Failed to update profile';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiPasswordChange(access: string, current_password: string, new_password: string, confirm_password: string) {
  const res = await fetch('/api/account/password/change/', {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify({ current_password, new_password, confirm_password }),
  });
  if (!res.ok) {
    let detail = 'Failed to update password';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiAccountDelete(access: string) {
  const res = await fetch('/api/account/delete/', {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify({ confirm: 'yes' }),
  });
  if (!res.ok) {
    let detail = 'Failed to delete account';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiNotificationsGet(access: string) {
  const res = await fetch('/api/account/notifications/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load notifications';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiNotificationsUpdate(access: string, payload: any) {
  const res = await fetch('/api/account/notifications/', {
    method: 'PUT',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = 'Failed to update notifications';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiLogout(refresh?: string) {
  const res = await fetch('/api/auth/logout/', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(refresh ? { refresh } : {}),
  });
  // Logout should succeed even with invalid refresh; don't throw hard
  try { return await res.json(); } catch { return {}; }
}

export async function apiAuthStatus(access: string): Promise<any> {
  const res = await fetch('/api/auth/status/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Status check failed';
    try {
      const j = await res.json();
      detail = j?.detail || JSON.stringify(j);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// Action Plan
export type ActionItemPayload = {
  title: string;
  source?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  due_date?: string; // YYYY-MM-DD
  assigned_to?: string; // initials/id
  status?: 'todo' | 'inprogress' | 'completed';
  enterprise?: number;
};

export async function apiActionBoard(access: string) {
  const res = await fetch('/api/action-items/board/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load action board';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiActionCreate(access: string, payload: ActionItemPayload) {
  const res = await fetch('/api/action-items/', {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = 'Failed to create task';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiActionBulkMove(access: string, items: Array<{id: number; status: 'todo'|'inprogress'|'completed'; order: number;}>) {
  const res = await fetch('/api/action-items/bulk-move/', {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    let detail = 'Failed to update ordering';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiRegister(fullName: string, email: string, password: string, phone: string) {
  const res = await fetch('/api/auth/register/', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ full_name: fullName, email, password, phone }),
  });
  if (!res.ok) {
    let detail = 'Registration failed';
    try {
      const j = await res.json();
      detail = j?.detail || JSON.stringify(j);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiDashboard(access: string) {
  const res = await fetch('/api/dashboard/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load dashboard';
    try {
      const j = await res.json();
      detail = j?.detail || JSON.stringify(j);
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}
