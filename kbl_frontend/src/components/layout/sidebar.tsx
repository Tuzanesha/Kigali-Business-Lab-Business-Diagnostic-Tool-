
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { profileApi, authApi, teamApi, getAccessToken } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Settings,
  LogOut,
  Users,
} from 'lucide-react';
import '../../styles/sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const allNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/assessments', icon: FileText, label: 'Assessments' },
  { href: '/action-plan', icon: ClipboardCheck, label: 'Action Plan' },
  { href: '/team-portal', icon: Users, label: 'Team Portal' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [fullName, setFullName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarError, setAvatarError] = useState<boolean>(false);
  const [isTeamMemberOnly, setIsTeamMemberOnly] = useState<boolean | null>(null); // null = checking, true = team member, false = owner
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  const isLinkActive = (href: string) => {
    return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          await profileApi.logout(refreshToken);
        } catch (e) {
          // Even if API call fails, continue with local cleanup
          console.error('Logout API call failed:', e);
        }
      }
    } catch (e) {
      console.error('Error during logout:', e);
    } finally {
      // Clear all tokens regardless of API call success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('isLoggedIn');
      toast.success('You have been logged out.', { duration: 2500 });
      router.push('/login');
    }
  };

  const sidebarClassName = `sidebar ${isOpen ? 'open' : ''}`;

  const loadProfile = async () => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) return;
      const response = await profileApi.get(accessToken);
      setFullName(response?.full_name || '');
      // Ensure avatar URL is a full URL and add timestamp to prevent caching
      const avatarUrlValue = response?.avatar_url || '';
      if (avatarUrlValue) {
        // Add timestamp to force refresh if needed
        const separator = avatarUrlValue.includes('?') ? '&' : '?';
        setAvatarUrl(`${avatarUrlValue}${separator}t=${Date.now()}`);
        setAvatarError(false); // Reset error state when new URL is loaded
      } else {
        setAvatarUrl('');
        setAvatarError(false);
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
      // If profile load fails, clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    }
  };

  useEffect(() => {
    loadProfile();
    
    // Check if user is team member only
    const checkTeamMemberStatus = async () => {
      try {
        const accessToken = getAccessToken();
        if (!accessToken) {
          setIsTeamMemberOnly(false);
          setIsCheckingRole(false);
          return;
        }
        
        // Strategy: Check team portal first - this is the most reliable way to detect team members
        // If team portal returns data (not an error), user is a team member
        // If it returns 403 with is_owner: true, user is an owner
        
        try {
          const portalData = await teamApi.getPortal(accessToken);
          // If we get data back from team portal, user is a team member
          // Check explicit flags first
          if (portalData.is_team_member_only === true) {
            setIsTeamMemberOnly(true);
            setIsCheckingRole(false);
            return;
          }
          // If has enterprises and is_owner is explicitly false, they're a team member
          if (portalData.total_enterprises > 0 && portalData.is_owner === false) {
            setIsTeamMemberOnly(true);
            setIsCheckingRole(false);
            return;
          }
          // If is_owner is explicitly true in response, they're an owner
          if (portalData.is_owner === true) {
            setIsTeamMemberOnly(false);
            setIsCheckingRole(false);
            return;
          }
          // If we got data but no explicit flags, check if they have enterprises
          // Having enterprises without being owner means team member
          if (portalData.total_enterprises > 0) {
            setIsTeamMemberOnly(true);
            setIsCheckingRole(false);
            return;
          }
          // No enterprises - might be new user, check enterprise profile
        } catch (portalError: any) {
          // Check error response for owner indicators
          if (portalError?.status === 403) {
            if (portalError?.data?.is_owner === true) {
              // Owner - not team member
              setIsTeamMemberOnly(false);
              setIsCheckingRole(false);
              return;
            }
            if (portalError?.data?.is_team_member_only === false) {
              // New user (not team member) - owner
              setIsTeamMemberOnly(false);
              setIsCheckingRole(false);
              return;
            }
          }
          // If portal fails with other error, might be team member or owner
          // Continue to enterprise profile check
        }
        
        // Fallback: Check enterprise profile
        // If they can access it (even 404), they're an owner
        try {
          await enterpriseApi.getProfile(accessToken);
          // Can access - owner
          setIsTeamMemberOnly(false);
        } catch (enterpriseError: any) {
          // 404 = new owner, 403 = might be team member
          if (enterpriseError?.status === 404) {
            setIsTeamMemberOnly(false); // New owner
          } else if (enterpriseError?.status === 403) {
            // Can't access - likely team member
            setIsTeamMemberOnly(true);
          } else {
            // Other error - default to owner
            setIsTeamMemberOnly(false);
          }
        }
      } catch (e: any) {
        // Default to false (owner or new user)
        setIsTeamMemberOnly(false);
      } finally {
        setIsCheckingRole(false);
      }
    };
    
    checkTeamMemberStatus();
    
    // Listen for profile updates (e.g., when avatar is changed)
    const handleProfileUpdate = () => {
      loadProfile();
    };
    
    // Re-check team member status when navigating (in case role changed)
    const handleRouteChange = () => {
      checkTeamMemberStatus();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('focus', handleRouteChange); // Re-check when window gains focus
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('focus', handleRouteChange);
    };
  }, [pathname]); // Re-run when pathname changes
  
  // Filter nav items based on user role
  // Team members ONLY see Team Portal (as Home) and Settings (no Dashboard, Assessments, Action Plan)
  // Owners see Dashboard, Assessments, Action Plan, and Settings (no Team Portal)
  // Show minimal nav while checking, then filter based on role
  const navItems = isCheckingRole
    ? allNavItems.filter(item => item.href === '/settings') // Show only Settings while checking
    : isTeamMemberOnly === true
    ? allNavItems
        .filter(item => item.href === '/team-portal' || item.href === '/settings')
        .map(item => item.href === '/team-portal' ? { ...item, label: 'Home' } : item) // Rename Team Portal to Home for team members
    : allNavItems.filter(item => item.href !== '/team-portal');

  const initials = React.useMemo(() => {
    const n = (fullName || '').trim();
    if (!n) return 'U';
    const parts = n.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  }, [fullName]);

  return (
    <aside className={sidebarClassName}>
      <div className="sidebar-logo-container">
        <Link href="/dashboard" className="sidebar-logo-link">
          <div className="sidebar-logo">
            <Image src="/kbl-logo-white.png" alt="KBL Logo" width={80} height={40} priority />
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = isLinkActive(item.href);
          const linkClassName = `sidebar-link ${isActive ? 'active' : ''}`;
          return (
            <Link key={item.label} href={item.href} className={linkClassName}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button onClick={handleLogout} className="sidebar-logout-button">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sidebar-profile">
        <div className="sidebar-profile-content">
          {avatarUrl && avatarUrl.trim() && !avatarError ? (
            <img 
              src={avatarUrl} 
              alt={fullName || 'User'} 
              className="sidebar-profile-avatar-image"
              onError={() => {
                // Mark error and show initials fallback
                setAvatarError(true);
              }}
            />
          ) : (
            <div className="sidebar-profile-avatar">{initials}</div>
          )}
          <p className="sidebar-profile-name">{fullName || 'User'}</p>
        </div>
      </div>
    </aside>
  );
}