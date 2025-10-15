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
//           <p className={styles['welcome-message']}>Welcome back, John Doe!</p>
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

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUp, PlusCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './dashboard.module.css';
import Link from 'next/link';


const NewUserWelcome = () => {
  return (
    <div>
      <header className={styles['page-header']}>
        <div>
          <h1 className={styles['page-title']}>WELCOME TO KBL</h1>
          
        </div>
      </header>
      <div className={styles['welcome-card']}>
        <h2 className={styles['welcome-title']}>Create Your Enterprise Profile</h2>
        <p className={styles['welcome-text']}>
          Your enterprise profile is the first step to unlocking insights and tracking your business's health. Let's get it filled out.
        </p>
        <Link href="/settings" className={styles['welcome-button']}>
          Create Enterprise Profile
        </Link>
      </div>
    </div>
  );
};


const ExistingUserDashboard = () => {
  const chartData = [
    { name: 'Leadership', latest: 75, previous: 68 },
    { name: 'Organisation', latest: 62, previous: 58 },
    { name: 'Sales', latest: 60, previous: 55 },
    { name: 'Financials', latest: 40, previous: 38 },
    { name: 'Marketing', latest: 65, previous: 50 },
    { name: 'Operations', latest: 70, previous: 72 },
  ];

  return (
    <div className={styles['dashboard-page']}>
      <header className={styles['page-header']}>
        <div>
          <h1 className={styles['page-title']}>DASHBOARD</h1>
          <p className={styles['welcome-message']}>Welcome back, John Doe!</p>
        </div>
        <Link href="/assessments/new" className={styles.newAssessmentButton}>
          <PlusCircle height={20} width={20} />
          <span>Start New Assessment</span>
        </Link>
      </header>

      <div className={styles['kpi-grid']}>
        <div className={styles['kpi-card']}><p className={styles['kpi-title']}>Overall Health Score</p><p className={styles['kpi-value']}>72%</p><p className={styles['kpi-subtext']}><ArrowUp color="green" height={16} width={16} />+5% vs last assessment</p></div>
        <div className={styles['kpi-card']}><p className={styles['kpi-title']}>Open Action Items</p><p className={styles['kpi-value']}>8</p><p className={styles['kpi-subtext']}>3 items are high priority</p></div>
        <div className={styles['kpi-card']}><p className={styles['kpi-title']}>Assessments Completed</p><p className={styles['kpi-value']}>14</p><p className={styles['kpi-subtext']}>In the last 6 months</p></div>
      </div>

      <div className={styles['main-chart-card']}>
        <div className={styles['chart-header']}><h2 className={styles['chart-title']}>HISTORICAL PERFORMANCE</h2><div className={styles['chart-legend']}><div className={styles['legend-item']}><div className={styles['legend-color-box']} style={{ backgroundColor: '#01497f' }}></div><span>Latest Assessment</span></div><div className={styles['legend-item']}><div className={styles['legend-color-box']} style={{ backgroundColor: '#7dd3fc' }}></div><span>Previous Assessment</span></div></div></div>
        <div style={{ width: '100%', height: 300 }}><ResponsiveContainer><BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: '#64748b' }} unit="%" axisLine={false} tickLine={false} /><Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} cursor={{ fill: '#f1f5f9' }} /><Bar dataKey="previous" fill="#7dd3fc" radius={[4, 4, 0, 0]} /><Bar dataKey="latest" fill="#01497f" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>

      <div className={styles['insight-grid']}><div className={styles['insight-card']}><div className={styles['insight-icon']}><TrendingUp /></div><div><h3 className={styles['insight-title']}>Greatest Improvement</h3><p className={styles['insight-text']}>The &apos;Marketing&apos; score increased by 15% this quarter.</p></div></div><div className={styles['insight-card']}><div className={styles['insight-icon']}><AlertTriangle /></div><div><h3 className={styles['insight-title']}>Priority Focus Area</h3><p className={styles['insight-text']}>&apos;Financial Planning&apos; is the lowest scoring area at 25%.</p></div></div></div>
    </div>
  );
};


export default function DashboardPageController() {
  const [hasEnterpriseProfile, setHasEnterpriseProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserProfile = () => {
      const loadingPromise = new Promise<void>(resolve => {
        setTimeout(() => {
          const userHasProfile = false; 
          setHasEnterpriseProfile(userHasProfile);
          setIsLoading(false);
          resolve();
        }, 1500);
      });
      
      toast.promise(loadingPromise, {
        loading: 'Loading dashboard...',
        success: 'Welcome back, John Doe!',
        error: 'Could not load dashboard data.',
      });
    };
    checkUserProfile();
  }, []);

  if (isLoading) {
    return <div className={styles['dashboard-page']}>Loading...</div>; 
  }

  return hasEnterpriseProfile ? <ExistingUserDashboard /> : <NewUserWelcome />;
}