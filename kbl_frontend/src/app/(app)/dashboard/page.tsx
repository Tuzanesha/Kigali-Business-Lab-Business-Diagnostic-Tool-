'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Settings,
  ArrowUp,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './dashboard.module.css';

// ============================================================================
//  Sidebar Component (inside the same file for reliability)
// ============================================================================
const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/assessments', icon: FileText, label: 'Assessments' },
  { href: '/action-plan', icon: ClipboardCheck, label: 'Action Plan' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-64 flex-col bg-[#012f53] text-white p-4">
      <div className="p-4 mb-6">
        <Link href="/dashboard">
          <div className="bg-white text-[#012f53] font-heading font-bold text-xl p-2 rounded-md w-14 text-center">
            KBL
          </div>
        </Link>
      </div>
      <nav className="flex flex-col flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-slate-300 transition-all hover:text-white hover:bg-[#01497f]/50',
              pathname === item.href && 'bg-[#0179d2] text-white'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
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
};

// ============================================================================
//  Dashboard Content Component
// ============================================================================
const chartData = [
  { name: 'Leadership', latest: 75, previous: 68 },
  { name: 'Organisation', latest: 62, previous: 58 },
  { name: 'Sales', latest: 60, previous: 55 },
  { name: 'Financials', latest: 40, previous: 38 },
  { name: 'Marketing', latest: 65, previous: 50 },
  { name: 'Operations', latest: 70, previous: 72 },
];

const DashboardContent = () => {
  return (
    <div className="flex-1 p-6 md:p-8">
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>DASHBOARD</h1>
          <p className={styles.welcomeMessage}>Welcome back, John Doe!</p>
        </div>
        <button className={styles.newAssessmentButton}>
          <PlusCircle height={20} width={20} />
          <span>Start New Assessment</span>
        </button>
      </header>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiTitle}>Overall Health Score</p>
          <p className={styles.kpiValue}>72%</p>
          <p className={styles.kpiSubtext}>
            <ArrowUp color="green" height={16} width={16} />
            +5% vs last assessment
          </p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiTitle}>Open Action Items</p>
          <p className={styles.kpiValue}>8</p>
          <p className={styles.kpiSubtext}>3 items are high priority</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiTitle}>Assessments Completed</p>
          <p className={styles.kpiValue}>14</p>
          <p className={styles.kpiSubtext}>In the last 6 months</p>
        </div>
      </div>

      <div className={styles.mainChartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>HISTORICAL PERFORMANCE</h2>
          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <div className={styles.legendColorBox} style={{ backgroundColor: '#01497f' }}></div>
              <span>Latest Assessment</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColorBox} style={{ backgroundColor: '#7dd3fc' }}></div>
              <span>Previous Assessment</span>
            </div>
          </div>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="previous" fill="#7dd3fc" radius={[4, 4, 0, 0]} />
              <Bar dataKey="latest" fill="#01497f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.insightGrid}>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon}><TrendingUp /></div>
          <div>
            <h3 className={styles.insightTitle}>Greatest Improvement</h3>
            <p className={styles.insightText}>The &apos;Marketing&apos; score increased by 15% this quarter.</p>
          </div>
        </div>
        <div className={styles.insightCard}>
          <div className={styles.insightIcon}><AlertTriangle /></div>
          <div>
            <h3 className={styles.insightTitle}>Priority Focus Area</h3>
            <p className={styles.insightText}>&apos;Financial Planning&apos; is the lowest scoring area at 25%.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
//  The Main Page Component that combines everything
// ============================================================================
export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <DashboardContent />
    </div>
  );
}