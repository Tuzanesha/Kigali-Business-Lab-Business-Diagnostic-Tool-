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

// Team APIs
export async function apiTeamList(access: string) {
  const res = await fetch('/api/team/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load team';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiTeamCreate(access: string, payload: { enterprise: number; email: string; role?: string }) {
  const res = await fetch('/api/team/', {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = 'Failed to add team member';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiTeamUpdate(access: string, id: number, payload: any) {
  const res = await fetch(`/api/team/${id}/`, {
    method: 'PATCH',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = 'Failed to update team member';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiTeamDelete(access: string, id: number) {
  const res = await fetch(`/api/team/${id}/`, {
    method: 'DELETE',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to delete team member';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
}

export async function apiTeamAccept(access: string, token: string) {
  const res = await fetch('/api/team/accept/', {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    let detail = 'Failed to accept invite';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
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

export async function apiProfileUpdate(access: string, payload: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
}) {
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

export async function apiUploadAvatar(access: string, file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const res = await fetch('/api/account/avatar/upload/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${access}` },
    body: formData,
  });
  
  if (!res.ok) {
    let detail = 'Failed to upload avatar';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiRemoveAvatar(access: string) {
  const res = await fetch('/api/account/avatar/remove/', {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  
  if (!res.ok) {
    let detail = 'Failed to remove avatar';
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

export async function apiPasswordResetRequest(email: string) {
  const res = await fetch('/api/auth/password-reset/request/', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    let detail = 'Failed to request password reset';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiPasswordResetConfirm(uid: string, token: string, new_password: string) {
  const res = await fetch('/api/auth/password-reset/confirm/', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ uid, token, new_password }),
  });
  if (!res.ok) {
    let detail = 'Failed to reset password';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
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

// Catalog: Categories & Questions
export async function apiCategories(access: string) {
  const res = await fetch('/api/categories/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load categories';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiQuestions(access: string, params?: { category?: string }) {
  const qs = params?.category ? `?category=${encodeURIComponent(params.category)}` : '';
  const res = await fetch(`/api/questions/${qs}`, {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load questions';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// Enterprises
export async function apiEnterprisesList(access: string) {
  const res = await fetch('/api/enterprises/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load enterprises';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiEnterpriseCreate(access: string, payload: any) {
  const res = await fetch('/api/enterprises/', {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = 'Failed to create enterprise';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// Enterprise profile (optional pk)
export async function apiEnterpriseProfileGet(access: string, id?: number) {
  const url = id ? `/api/enterprise/${id}/profile/` : '/api/enterprise/profile/';
  const res = await fetch(url, {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load enterprise profile';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiEnterpriseProfileUpdate(access: string, payload: any, id?: number) {
  const url = id ? `/api/enterprise/${id}/profile/` : '/api/enterprise/profile/';
  const res = await fetch(url, {
    method: 'PUT',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let detail = 'Failed to update enterprise profile';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// Assessment responses
export async function apiEnterpriseBulkAnswers(access: string, enterpriseId: number, answers: Array<{ question_id?: number; question_number?: string|number; score: number; evidence?: string; comments?: string; }>) {
  const res = await fetch(`/api/enterprises/${enterpriseId}/bulk-answers/`, {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
    body: JSON.stringify(answers),
  });
  if (!res.ok) {
    let detail = 'Failed to submit answers';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

export async function apiEnterpriseRecompute(access: string, enterpriseId: number) {
  const res = await fetch(`/api/enterprises/${enterpriseId}/recompute/`, {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to recompute summary';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// New: Reset all responses for an enterprise (start a fresh assessment)
export async function apiEnterpriseResetResponses(access: string, enterpriseId: number) {
  const res = await fetch(`/api/enterprises/${enterpriseId}/reset-responses/`, {
    method: 'POST',
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to reset responses';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// New: Dashboard KPI stats
export async function apiMyAssessmentStats(access: string) {
  const res = await fetch('/api/my/assessment-stats/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load stats';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// New: List assessment sessions (historical reports)
export async function apiMyAssessmentSessions(access: string) {
  const res = await fetch('/api/my/assessment-sessions/', {
    headers: { ...defaultHeaders, Authorization: `Bearer ${access}` },
  });
  if (!res.ok) {
    let detail = 'Failed to load assessment sessions';
    try { const j = await res.json(); detail = j?.detail || JSON.stringify(j); } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// Delete an assessment session
export async function apiDeleteAssessmentSession(access: string, sessionId: number): Promise<void> {
  // The correct URL should be /api/assessment-sessions/{id}/
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const url = `${baseUrl}/api/assessment-sessions/${sessionId}/`;
  
  console.log('Deleting assessment session at URL:', url);
  
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${access}`
      },
      credentials: 'include',
    });
    
    const contentType = res.headers.get('content-type');
    
    if (!res.ok) {
      let errorDetail = `Failed to delete assessment session (${res.status} ${res.statusText})`;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await res.json();
          errorDetail = data.detail || JSON.stringify(data);
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
      } else if (contentType && contentType.includes('text/html')) {
        const text = await res.text();
        console.error('Received HTML response instead of JSON. This might indicate a routing or server error.');
        console.error('Response preview:', text.substring(0, 200));
      }
      
      // If we're getting a 404, it might be because the URL is incorrect
      if (res.status === 404) {
        errorDetail = 'The requested resource was not found. Please check the URL and try again.';
      }
      
      throw new Error(errorDetail);
    }
    
    // If we get here, the deletion was successful
    console.log(`Successfully deleted assessment session ${sessionId}`);
    
  } catch (error) {
    console.error('Error in apiDeleteAssessmentSession:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete assessment session');
  }
}

 
