'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/assessments', icon: FileText, label: 'Assessments' },
  { href: '/action-plan', icon: ClipboardCheck, label: 'Action Plan' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col bg-kbl-deep text-white p-4">
      <div className="p-4 mb-4">
        <Link href="/dashboard" className="font-heading text-4xl font-bold">
          KBL
        </Link>
      </div>
      <nav className="flex flex-col flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-2.5 text-slate-300 transition-all hover:text-white hover:bg-kbl-dark',
              pathname === item.href && 'bg-kbl-dark text-white'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
        <Link
          href="/logout"
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-slate-300 transition-all hover:text-white hover:bg-kbl-dark"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Log Out</span>
        </Link>
      </div>
    </aside>
  );
}