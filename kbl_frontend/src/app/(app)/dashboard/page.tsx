// 'use client';

// import React, { useEffect } from 'react';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { ArrowUp, PlusCircle, TrendingUp, AlertTriangle } from 'lucide-react';
// import toast from 'react-hot-toast';
// import styles from './dashboard.module.css';
// import Link from 'next/link';
// import { useRouter } from 'next/router';

// export default function DashboardPage() {

//   // const router = useRouter();

//   // const handleLogout = () => {
//   //   localStorage.removeItem('isLoggedIn');
//   //   toast.success('Logged out successfully!');
//   //   router.push('/login');
//   // };
  
//   const chartData = [
//     { name: 'Leadership', latest: 75, previous: 68 },
//     { name: 'Organisation', latest: 62, previous: 58 },
//     { name: 'Sales', latest: 60, previous: 55 },
//     { name: 'Financials', latest: 40, previous: 38 },
//     { name: 'Marketing', latest: 65, previous: 50 },
//     { name: 'Operations', latest: 70, previous: 72 },
//   ];

//   useEffect(() => {
//     const loadingPromise = new Promise<void>(resolve => setTimeout(resolve, 1000));

//     toast.promise(
//       loadingPromise,
//       {
//         loading: 'Loading dashboard...',
//         success: 'Welcome back, John Doe!',
//         error: 'Could not load dashboard.',
//       }
//     );
//   }, []);

//   return (
//     <div className={styles['dashboard-page']}>
//       <header className={styles['page-header']}>
//         <div>
//           <h1 className={styles['page-title']}>DASHBOARD</h1>
//           <p className={styles['welcome-message']}>Welcome back{fullName ? `, ${fullName}` : ''}!</p>
//         </div>
//         <Link href="/assessments/new" className={styles.newAssessmentButton}>
//           <PlusCircle height={20} width={20} />
//           <span>Start New Assessment</span>
//         </Link>
//       </header>

//       <div className={styles['kpi-grid']}>
//         <div className={styles['kpi-card']}>
//           <p className={styles['kpi-title']}>Overall Health Score</p>
//           <p className={styles['kpi-value']}>72%</p>
//           <p className={styles['kpi-subtext']}>
//             <ArrowUp color="green" height={16} width={16} />
//             +5% vs last assessment
//           </p>
//         </div>
//         <div className={styles['kpi-card']}>
//           <p className={styles['kpi-title']}>Open Action Items</p>
//           <p className={styles['kpi-value']}>8</p>
//           <p className={styles['kpi-subtext']}>3 items are high priority</p>
//         </div>
//         <div className={styles['kpi-card']}>
//           <p className={styles['kpi-title']}>Assessments Completed</p>
//           <p className={styles['kpi-value']}>14</p>
//           <p className={styles['kpi-subtext']}>In the last 6 months</p>
//         </div>
//       </div>

//       <div className={styles['main-chart-card']}>
//         <div className={styles['chart-header']}>
//           <h2 className={styles['chart-title']}>HISTORICAL PERFORMANCE</h2>
//           <div className={styles['chart-legend']}>
//             <div className={styles['legend-item']}><div className={styles['legend-color-box']} style={{ backgroundColor: '#01497f' }}></div><span>Latest Assessment</span></div>
//             <div className={styles['legend-item']}><div className={styles['legend-color-box']} style={{ backgroundColor: '#7dd3fc' }}></div><span>Previous Assessment</span></div>
//           </div>
//         </div>
//         <div style={{ width: '100%', height: 300 }}>
//           <ResponsiveContainer>
//             <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
//               <CartesianGrid strokeDasharray="3 3" vertical={false} />
//               <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
//               <YAxis tick={{ fontSize: 12, fill: '#64748b' }} unit="%" axisLine={false} tickLine={false} />
//               <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} cursor={{ fill: '#f1f5f9' }} />
//               <Bar dataKey="previous" fill="#7dd3fc" radius={[4, 4, 0, 0]} />
//               <Bar dataKey="latest" fill="#01497f" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       <div className={styles['insight-grid']}>
//         <div className={styles['insight-card']}><div className={styles['insight-icon']}><TrendingUp /></div><div><h3 className={styles['insight-title']}>Greatest Improvement</h3><p className={styles['insight-text']}>The &apos;Marketing&apos; score increased by 15% this quarter.</p></div></div>
//         <div className={styles['insight-card']}><div className={styles['insight-icon']}><AlertTriangle /></div><div><h3 className={styles['insight-title']}>Priority Focus Area</h3><p className={styles['insight-text']}>&apos;Financial Planning&apos; is the lowest scoring area at 25%.</p></div></div>
//       </div>
//     </div>
//   );
// }


'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUp, PlusCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './dashboard.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboardApi, enterpriseApi, profileApi, assessmentApi, catalogApi, getAccessToken} from '../../../lib/api';

const NewUserWelcome = () => {
  return (
    <div>
      <header className={styles['page-header']}>
        <div>
          <h1 className={styles['page-title']}>WELCOME TO KBL</h1>
          <p className={styles['welcome-message']}>Let&apos;s get started with your business diagnostic journey</p>
        </div>
      </header>
      <div className={styles['welcome-card']}>
        <h2 className={styles['welcome-title']}>Create Your Enterprise Profile</h2>
        <p className={styles['welcome-text']}>
          Before you can run a business diagnostic assessment, you need to create your enterprise profile. 
          This helps us tailor the questions and analysis to your specific business.
        </p>
        <Link href="/settings?tab=enterprise" className={styles['welcome-button']}>
          Create Enterprise Profile
        </Link>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '1rem' }}>
          Only takes a few minutes to complete
        </p>
      </div>
    </div>
  );
};


const ExistingUserDashboard = () => {
  // Render X-axis labels on 1-2 lines without rotation (no oblique)
  const wrapLabel = (label: string, maxPerLine = 14, maxLines = 2): string[] => {
    if (!label) return [''];
    const words = String(label).split(' ');
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const tentative = current ? current + ' ' + w : w;
      if (tentative.length <= maxPerLine) {
        current = tentative;
      } else {
        if (current) lines.push(current);
        current = w;
      }
      if (lines.length === maxLines - 1 && words.indexOf(w) < words.length - 1) {
        // Put the rest in the last line if exceeding maxLines
        const remaining = words.slice(words.indexOf(w) + 1).join(' ');
        const last = current ? current + ' ' + remaining : remaining;
        lines.push(last);
        current = '';
        break;
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, maxLines);
  };

  const XTick = (props: any) => {
    const { x, y, payload } = props;
    const lines = wrapLabel(payload?.value || '', 14, 2);
    return (
      <g transform={`translate(${x},${y})`}>
        <text textAnchor="middle" fill="#64748b" fontSize={11} dy={14}>
          {lines.map((ln, i) => (
            <tspan key={i} x={0} dy={i === 0 ? 0 : 12}>{ln}</tspan>
          ))}
        </text>
      </g>
    );
  };
  const router = useRouter();
  const [overallPct, setOverallPct] = useState<number>(0);
  const [enterprises, setEnterprises] = useState<number>(0);
  const [chartData, setChartData] = useState<Array<{ name: string; latest: number; previous: number }>>([]);
  const [fullName, setFullName] = useState<string>('');
  const [assessmentsCompleted, setAssessmentsCompleted] = useState<number>(0);
  const [openActions, setOpenActions] = useState<number>(0);
  const [highPriority, setHighPriority] = useState<number>(0);
  const [deltaPct, setDeltaPct] = useState<number>(0);
  const [greatestImprovement, setGreatestImprovement] = useState<{
    enterprise: string;
    improvement: number;
  } | null>(null);
  const [priorityFocus, setPriorityFocus] = useState<{
    category: string;
    score: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const id = toast.loading('Loading dashboard...');
      try {
        const access = getAccessToken();
        if (!access) {
          toast.dismiss(id);
          router.push('/login');
          return;
        }
        // Load profile for greeting
        try {
          const profile = await profileApi.get(access);
          setFullName(profile?.full_name || '');
        } catch {}
        const data = await dashboardApi.getDashboard(access);
        setEnterprises(Number(data?.enterprises || 0));
        // Load KPI stats
        try {
          const stats = await assessmentApi.getStats(access);
          setAssessmentsCompleted(stats.assessments_completed);
          setOpenActions(stats.open_action_items);
          setHighPriority(stats.high_priority_actions);
          // Set greatest improvement data if available
          if (stats.greatest_improvement) {
            setGreatestImprovement({
              enterprise: stats.greatest_improvement.enterprise,
              improvement: stats.greatest_improvement.improvement
            });
          }
          // Set priority focus data if available
          if (stats.priority_focus) {
            setPriorityFocus({
              category: stats.priority_focus.category,
              score: stats.priority_focus.score
            });
          }
        } catch {}
        // Build chart from the last two AssessmentSessions and ensure 8 categories
        // Fetch sessions (latest first)
        const sessionsResp = await assessmentApi.getSessions(access);
        const sessions = Array.isArray(sessionsResp?.results) ? sessionsResp.results : [];
        const latest = sessions[0] || null;
        const previous = sessions[1] || null;
        // Fallback to dashboard summary if no session yet
        const latestOverall = latest && typeof latest.overall_percentage === 'number' ? Number(latest.overall_percentage) : Number(data?.latest_overall_percentage || 0);
        const previousOverall = previous && typeof previous.overall_percentage === 'number' ? Number(previous.overall_percentage) : 0;
        setOverallPct(latestOverall);
        setDeltaPct(latestOverall - previousOverall);
        // Categories list for consistent labels and order
        const cats = await catalogApi.getCategories(access);
        const catList = Array.isArray(cats?.results) ? cats.results : (Array.isArray(cats) ? cats : []);
        const fromApi: string[] = catList.map((c: any) => String(c?.name || '')).filter(Boolean);
        // Read section scores from sessions if available; each entry shaped like { percentage }
        const latestSections = (latest as any)?.section_scores || {};
        const prevSections = (previous as any)?.section_scores || {};
        // Also get latest summary as a fallback for full category keys
        const summaries = await assessmentApi.getSummaries(access);
        const firstSummary = (Array.isArray(summaries?.results) ? summaries.results : [])[0] || {};
        const summarySections = firstSummary?.section_scores || {};
        // Build unified ordered list of names: categories first, then any extra keys found in data
        const unionNames = Array.from(new Set([...(fromApi || []), ...Object.keys(summarySections || {}), ...Object.keys(latestSections || {})]));
        const orderedNames = unionNames.slice(0, 8);
        const rows = (orderedNames.length ? orderedNames : Object.keys(latestSections)).map((name: string) => {
          const lv = latestSections?.[name]?.percentage ?? latestSections?.[name] ?? 0;
          const pv = prevSections?.[name]?.percentage ?? prevSections?.[name] ?? 0;
          return { name, latest: Number(lv || 0), previous: Number(pv || 0) };
        });
        setChartData(rows);
        toast.success('Dashboard loaded', { id, duration: 1500 });
      } catch (e:any) {
        toast.error(e?.message || 'Could not load dashboard.', { id, duration: 2500 });
        if ((e?.message||'').toLowerCase().includes('unauthorized') || (e?.message||'').includes('403')) {
          router.push('/login');
        }
      }
    };
    load();
  }, [router]);

  return (
    <div className={styles['dashboard-page']}>
      <header className={styles['page-header']}>
        <div>
          <h1 className={styles['page-title']}>DASHBOARD</h1>
          <p className={styles['welcome-message']}>Welcome back{fullName ? `, ${fullName}` : ''}!</p>
        </div>
        <Link href="/assessments/new" className={styles.newAssessmentButton}>
          <PlusCircle height={20} width={20} />
          <span>Start New Assessment</span>
        </Link>
      </header>

      <div className={styles['kpi-grid']}>
        <div className={styles['kpi-card']}>
          <p className={styles['kpi-title']}>Overall Health Score</p>
          <p className={styles['kpi-value']}>{Math.round(overallPct)}%</p>
          <p className={styles['kpi-subtext']}>
            <ArrowUp color={deltaPct >= 0 ? 'green' : 'red'} height={16} width={16} />
            {deltaPct >= 0 ? `+${Math.abs(Math.round(deltaPct))}%` : `-${Math.abs(Math.round(deltaPct))}%`} vs previous
          </p>
        </div>
        <div className={styles['kpi-card']}>
          <p className={styles['kpi-title']}>Open Action Items</p>
          <p className={styles['kpi-value']}>{openActions}</p>
          <p className={styles['kpi-subtext']}>{highPriority} items are high priority</p>
        </div>
        <div className={styles['kpi-card']}>
          <p className={styles['kpi-title']}>Assessments Completed</p>
          <p className={styles['kpi-value']}>{assessmentsCompleted}</p>
          <p className={styles['kpi-subtext']}>All-time</p>
        </div>
        
      </div>

      <div className={styles['main-chart-card']}>
        <div className={styles['chart-header']}><h2 className={styles['chart-title']}>HISTORICAL PERFORMANCE</h2><div className={styles['chart-legend']}><div className={styles['legend-item']}><div className={styles['legend-color-box']} style={{ backgroundColor: '#01497f' }}></div><span>Latest Assessment</span></div><div className={styles['legend-item']}><div className={styles['legend-color-box']} style={{ backgroundColor: '#7dd3fc' }}></div><span>Previous Assessment</span></div></div></div>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 60 }} barCategoryGap={16} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" interval={0} height={60} tick={<XTick />} tickMargin={16} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="previous" fill="#7dd3fc" radius={[4, 4, 0, 0]} />
              <Bar dataKey="latest" fill="#01497f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles['insight-grid']}>
        <div className={styles['insight-card']}>
          <div className={styles['insight-icon']}><TrendingUp /></div>
          <div>
            <h3 className={styles['insight-title']}>Greatest Improvement</h3>
            {greatestImprovement ? (
              <p className={styles['insight-text']}>
                <strong>{greatestImprovement.enterprise}</strong> improved by {greatestImprovement.improvement}% since last assessment.
              </p>
            ) : (
              <p className={styles['insight-text']}>No improvement data available yet.</p>
            )}
          </div>
        </div>
        <div className={styles['insight-card']}>
          <div className={styles['insight-icon']}><AlertTriangle /></div>
          <div>
            <h3 className={styles['insight-title']}>Priority Focus Area</h3>
            {priorityFocus ? (
              <p className={styles['insight-text']}>
                <strong>{priorityFocus.category}</strong> is the lowest scoring area at {priorityFocus.score}%.
              </p>
            ) : (
              <p className={styles['insight-text']}>No priority focus data available yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function DashboardPageController() {
  const [hasEnterpriseProfile, setHasEnterpriseProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserProfile = async () => {
      const id = toast.loading('Loading dashboard...');
      try {
        const access = getAccessToken();
        if (!access) {
          toast.dismiss(id);
          setIsLoading(false);
          return;
        }
        // If enterprise profile exists, backend returns 200; otherwise 404
        await enterpriseApi.getProfile(access);
        setHasEnterpriseProfile(true);
        toast.success('Welcome back!', { id });
      } catch (e:any) {
        // 404 means no enterprise yet
        setHasEnterpriseProfile(false);
        toast.dismiss(id);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserProfile();
  }, []);

  if (isLoading) {
    return <div className={styles['dashboard-page']}>Loading...</div>; 
  }

  return hasEnterpriseProfile ? <ExistingUserDashboard /> : <NewUserWelcome />;
}