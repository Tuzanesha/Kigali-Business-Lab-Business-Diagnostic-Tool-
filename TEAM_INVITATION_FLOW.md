# Team Member Invitation Flow - Design Proposal

## Overview
When a team member is invited to work on an enterprise, they should have a clear path to accept the invitation and access the enterprise's data.

## Current Implementation
- Team members are created with an invitation token
- Invitation email is sent with a link
- Token expires after 7 days
- Backend has an `/api/team/accept/` endpoint

## Proposed User Flow

### 1. **Invitation Email**
When an enterprise owner invites a team member:
- Email is sent with:
  - Inviter's name
  - Enterprise name
  - Invitation link: `http://localhost:8085/team/accept?token={token}`
  - Expiration date (7 days)

### 2. **Invitation Acceptance Page** (`/team/accept`)
**For New Users (Not Registered):**
- Display invitation details (enterprise name, inviter name, role)
- Show "Accept Invitation" button
- If clicked:
  - Redirect to signup page with pre-filled email
  - After signup, automatically accept invitation
  - Redirect to dashboard showing the enterprise

**For Existing Users (Already Registered):**
- If user is logged in:
  - Show invitation details
  - "Accept Invitation" button
  - On accept: Link team member record to user account
  - Redirect to dashboard with enterprise context
- If user is not logged in:
  - Show invitation details
  - "Log in to Accept" button → redirect to login
  - After login, automatically accept invitation
  - Redirect to dashboard

### 3. **Post-Acceptance Experience**

**Dashboard Access:**
- Team members see the enterprise in their dashboard
- Can view assessments, action plans, and reports
- Access level depends on role:
  - **ADMIN**: Full access (same as owner)
  - **MANAGER**: Can view and edit assessments, action items
  - **MEMBER**: Can view assessments, assigned action items

**Action Plan:**
- Team members see action items assigned to them
- Can update status of their assigned items
- Can view all action items (read-only for non-admins)

**Assessments:**
- Can view all assessment reports
- Can take new assessments (if manager/admin)
- Can view historical assessment sessions

**Settings:**
- Team members see a "Team" section showing:
  - Their role
  - Enterprise they're part of
  - Other team members (if admin/manager)
  - Option to leave the team

### 4. **Frontend Pages to Create**

1. **`/team/accept`** - Invitation acceptance page
   - Handles both logged-in and logged-out users
   - Validates token
   - Shows invitation details
   - Processes acceptance

2. **Update Dashboard** - Show enterprises user is part of (owner + team member)
   - Filter enterprises by ownership OR team membership
   - Show role badge for team memberships

3. **Update Settings** - Add "Team Memberships" section
   - List all enterprises user is part of
   - Show role for each
   - Option to leave team

### 5. **Backend Endpoints Needed**

✅ Already exists:
- `POST /api/team/accept/` - Accept invitation with token

🔄 May need updates:
- `GET /api/dashboard/` - Include enterprises where user is team member
- `GET /api/enterprises/` - Include enterprises where user is team member
- `POST /api/team/{id}/leave/` - Allow team member to leave

### 6. **Security Considerations**

- Token validation (expiration check)
- Prevent duplicate acceptances
- Verify user email matches invitation email
- Role-based access control in all endpoints
- Team members can only see data for enterprises they're part of

### 7. **UI/UX Recommendations**

**Invitation Email:**
- Clean, professional design matching KBL branding
- Clear call-to-action button
- Mobile-responsive

**Acceptance Page:**
- Show enterprise logo if available
- Clear indication of what they're accepting
- Loading states during acceptance
- Success message with next steps

**Dashboard:**
- Visual distinction between owned enterprises and team memberships
- Role badges (Admin, Manager, Member)
- Quick access to switch between enterprises

## Implementation Priority

1. **Phase 1 (Critical):**
   - Create `/team/accept` page
   - Handle invitation acceptance for logged-in users
   - Update dashboard to show team memberships

2. **Phase 2 (Important):**
   - Handle new user signup flow with invitation
   - Update all enterprise-related endpoints to include team memberships
   - Add role-based access control

3. **Phase 3 (Enhancement):**
   - Team member leave functionality
   - Team member management UI for admins
   - Notification system for team activities

## Example User Journey

1. **Sarah (Enterprise Owner)** invites **John (john@example.com)** as a Manager
2. **John** receives email: "Sarah invited you to join Acme Corp on Kigali Business Lab"
3. **John** clicks link → Lands on `/team/accept?token=abc123`
4. **John** is not logged in → Sees invitation details → Clicks "Log in to Accept"
5. **John** logs in → Automatically redirected back to accept page → Invitation accepted
6. **John** is redirected to dashboard → Sees "Acme Corp" with "Manager" badge
7. **John** can now view assessments, action plans, and reports for Acme Corp



