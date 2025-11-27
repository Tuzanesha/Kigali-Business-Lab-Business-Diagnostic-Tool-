
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { profileApi, authApi, getAccessToken } from '../../lib/api';
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

const navItems = [
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
    
    // Listen for profile updates (e.g., when avatar is changed)
    const handleProfileUpdate = () => {
      loadProfile();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

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