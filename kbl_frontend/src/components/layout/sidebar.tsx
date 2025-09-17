'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Settings,
} from 'lucide-react';

// Data for our navigation links
const navItems = [
  { href: '/(app)/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/assessments', icon: FileText, label: 'Assessments' },
  { href: '/action-plan', icon: ClipboardCheck, label: 'Action Plan' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col bg-[#012f53] text-white p-4">
      {/* Logo Section */}
      <div className="p-4 mb-6">
        <Link href="/dashboard">
          <div className="bg-white text-[#012f53] font-heading font-bold text-xl p-2 rounded-md w-14 text-center">
            KBL
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-slate-300 transition-all hover:text-white hover:bg-[#01497f]/50',
              pathname === item.href && 'bg-[#0179d2] text-white' // Active state style
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User Profile Section at the bottom */}
      <div className="mt-auto p-2 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0179d2]">
            <span className="text-sm font-semibold">JD</span>
          </div>
          <div>
            <p className="text-sm font-semibold">John Doe</p>
          </div>
        </div>
      </div>
    </aside>
  );
}