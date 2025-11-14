
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { apiProfileGet } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Settings,
  LogOut,
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
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [fullName, setFullName] = useState<string>('');

  const isLinkActive = (href: string) => {
    return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
          toast.success('You have been logged out.', { duration: 2500 });
    router.push('/login');
  };

  const sidebarClassName = `sidebar ${isOpen ? 'open' : ''}`;

  useEffect(() => {
    const load = async () => {
      try {
        const access = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
        if (!access) return;
        const profile = await apiProfileGet(access);
        setFullName(profile?.full_name || '');
      } catch {}
    };
    load();
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
          <div className="sidebar-profile-avatar">{initials}</div>
          <p className="sidebar-profile-name">{fullName || 'User'}</p>
        </div>
      </div>
    </aside>
  );
}