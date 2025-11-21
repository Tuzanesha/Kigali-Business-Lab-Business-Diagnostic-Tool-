# Team Member Portal - Design & Implementation Guide

## Overview
Team members who accept invitations should have access to view and work with the enterprise they've been invited to, with permissions based on their role.

## Current Backend Status

### What Exists:
1. ✅ Team member model with roles (ADMIN, MANAGER, MEMBER)
2. ✅ Invitation system with tokens
3. ✅ Team member acceptance endpoint (`/api/team/accept/`)
4. ✅ Team member linking to user accounts

### What Needs to Be Added:
1. Dashboard should show enterprises where user is a team member (not just owner)
2. Enterprise endpoints should allow access for team members
3. Action items should be visible to team members
4. Assessment reports should be viewable by team members
5. Role-based permissions for different actions

## Team Member Portal Experience

### 1. **Dashboard View**
**What team members see:**
- List of enterprises they're part of (as team members)
- Their role badge (Admin, Manager, Member) for each enterprise
- Assessment scores and status for those enterprises
- Action items assigned to them
- Recent activity/updates

**Implementation:**
- Update `DashboardView` to include enterprises where user is a team member
- Show role information
- Filter data based on role permissions

### 2. **Enterprise Access**
**What team members can do by role:**

**ADMIN:**
- Full access (same as owner)
- View all assessments
- Create/edit assessments
- Manage action items
- View/edit enterprise profile
- Manage other team members

**MANAGER:**
- View all assessments
- Create new assessments
- View/edit action items
- View enterprise profile (read-only)
- View team members (read-only)

**MEMBER:**
- View assessment reports (read-only)
- View action items assigned to them
- Update status of assigned action items
- View enterprise profile (read-only)

### 3. **Assessment Access**
**Team members should be able to:**
- View all assessment reports for their enterprise
- See historical assessment sessions
- View detailed scores by category
- Download/export reports (if manager/admin)

**Restrictions:**
- Members: Read-only access
- Managers/Admins: Can create new assessments

### 4. **Action Plan Access**
**Team members should see:**
- Action items assigned to them (all roles)
- All action items (if manager/admin)
- Ability to update status of assigned items
- Ability to create items (if manager/admin)

### 5. **Settings/Profile**
**Team members should see:**
- Their profile information
- List of enterprises they're part of
- Their role for each enterprise
- Option to leave a team (if not admin)
- Notification preferences

## Implementation Steps

### Phase 1: Backend Updates

1. **Update DashboardView** (`diagnostic/views.py`):
   ```python
   def get(self, request):
       # Get owned enterprises
       owned_enterprises = Enterprise.objects.filter(owner=request.user)
       
       # Get enterprises where user is a team member
       team_memberships = TeamMember.objects.filter(
           user=request.user,
           status=TeamMember.STATUS_ACTIVE
       ).select_related('enterprise')
       
       # Combine and return with role information
   ```

2. **Update EnterpriseViewSet** to allow team member access:
   ```python
   def get_queryset(self):
       # Include enterprises where user is owner OR team member
       owned = Enterprise.objects.filter(owner=self.request.user)
       team_enterprises = Enterprise.objects.filter(
           team_members__user=self.request.user,
           team_members__status=TeamMember.STATUS_ACTIVE
       )
       return (owned | team_enterprises).distinct()
   ```

3. **Add role-based permissions** to views:
   - Check if user is owner or team member
   - Check role for specific permissions
   - Return appropriate data based on role

4. **Update ActionItemViewSet**:
   - Show items for enterprises where user is team member
   - Filter by assigned_to for members
   - Show all for managers/admins

### Phase 2: Frontend Updates

1. **Update Dashboard**:
   - Show enterprises with role badges
   - Filter/group by owned vs. team member
   - Show appropriate actions based on role

2. **Update Enterprise Selection**:
   - Allow switching between enterprises
   - Show current role
   - Disable actions based on role

3. **Update Action Plan**:
   - Show all items for managers/admins
   - Show only assigned items for members
   - Disable drag-drop for members (read-only)

4. **Create Team Member Portal Page**:
   - `/team/accept` - Accept invitation
   - Show invitation details
   - Handle login/signup flow
   - Redirect to dashboard after acceptance

### Phase 3: UI/UX Enhancements

1. **Role Badges**:
   - Visual indicators (Admin, Manager, Member)
   - Color coding
   - Tooltips explaining permissions

2. **Permission Indicators**:
   - Disable buttons/actions user can't perform
   - Show tooltips explaining why
   - Clear messaging about role limitations

3. **Enterprise Switcher**:
   - Dropdown to switch between enterprises
   - Show role for each
   - Quick access to owned vs. team enterprises

## Example User Flow

### Scenario: John accepts invitation as Manager

1. **John receives email** with invitation link
2. **Clicks link** → Lands on `/team/accept?token=abc123`
3. **If not logged in**:
   - Sees invitation details
   - Clicks "Log in to Accept"
   - Logs in → Auto-redirects to accept
   - Invitation accepted
4. **Redirected to dashboard**:
   - Sees "Acme Corp" with "Manager" badge
   - Can view all assessments
   - Can create new assessments
   - Can view/edit action items
   - Cannot edit enterprise profile (read-only)
5. **Can switch between enterprises** if part of multiple

## Security Considerations

1. **Always verify team membership** before showing data
2. **Check role permissions** for each action
3. **Filter querysets** to only show accessible enterprises
4. **Validate ownership/team membership** in all views
5. **Prevent privilege escalation** (members can't become admins)

## API Endpoints to Update

1. `GET /api/dashboard/` - Include team memberships
2. `GET /api/enterprises/` - Include team enterprises
3. `GET /api/enterprises/{id}/` - Allow team member access
4. `GET /api/action-items/` - Filter by team membership
5. `GET /api/my/assessment-stats/` - Include team enterprises
6. `GET /api/my/assessment-sessions/` - Include team enterprises

## Next Steps

1. **Immediate**: Fix 401 errors in team management (use `getAccessToken()`)
2. **Short-term**: Update dashboard to show team memberships
3. **Medium-term**: Implement role-based access control
4. **Long-term**: Create team member portal UI and acceptance flow



