'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, ClipboardCheck, Settings, X } from 'lucide-react';
import '../../styles/sidebar.css';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/assessments', icon: FileText, label: 'Assessments' },
  { href: '/action-plan', icon: ClipboardCheck, label: 'Action Plan' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

// The component now accepts props
export function Sidebar({
  isOpen,
  toggleSidebar,
}: {
  isOpen: boolean;
  toggleSidebar: () => void;
}) {
  const pathname = usePathname();

  return (
    // Conditionally add the 'open' class
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="sidebar-logo-container">
          <Link href="/dashboard" className="sidebar-logo-link">
            <div className="sidebar-logo">
              <Image src="/kbl-logo-white.png" alt="KBL Logo" width={80} height={40} priority />
            </div>
          </Link>
        </div>
        {/* This is the close button, only visible on mobile when the sidebar is open */}
        <button onClick={toggleSidebar} className="hamburger-button" style={{ color: 'white', display: 'none' }} >
           <X className="h-6 w-6" />
        </button>
        <style jsx>{`
          @media (max-width: 767px) {
            .hamburger-button {
              display: block;
            }
          }
        `}</style>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const linkClassName = `sidebar-link ${isActive ? 'active' : ''}`;
          return (
            <Link key={item.label} href={item.href} className={linkClassName} onClick={isOpen ? toggleSidebar : undefined}>
              <item.icon className="sidebar-icon" />
              <span className="sidebar-link-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-profile">
        <div className="sidebar-profile-content">
          <div className="sidebar-profile-avatar">
            <span className="sidebar-profile-initials">JD</span>
          </div>
          <div>
            <p className="sidebar-profile-name">John Doe</p>
          </div>
        </div>
      </div>
    </aside>
  );
}