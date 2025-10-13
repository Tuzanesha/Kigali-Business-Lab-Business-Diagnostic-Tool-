// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import { usePathname } from 'next/navigation';
// import { LayoutDashboard, FileText, ClipboardCheck, Settings } from 'lucide-react';
// import '../../styles/sidebar.css';



// const navItems = [
//   { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
//   { href: '/assessments', icon: FileText, label: 'Assessments' },
//   { href: '/action-plan', icon: ClipboardCheck, label: 'Action Plan' },
//   { href: '/settings', icon: Settings, label: 'Settings' },
// ];

// export function Sidebar() {
//   const pathname = usePathname();

  

//   return (
//     <aside className="sidebar">
    
//         <div className="sidebar-logo-container">
        //  <Link href="/dashboard" className="sidebar-logo-link">
        //     <div className="sidebar-logo">
        //          <Image src="/kbl-logo-white.png" alt="KBL Logo" width={80} height={40} priority />
        //    </div>
        //  </Link>
//          </div>
      
//       <nav className="sidebar-nav">
//         {navItems.map((item) => {
//           const isActive = item.href === '/dashboard' 
//             ? pathname === item.href 
//             : pathname.startsWith(item.href);

//           const linkClassName = `sidebar-link ${isActive ? 'active' : ''}`;

//           return (
//             <Link key={item.label} href={item.href} className={linkClassName}>
//               <item.icon size={18} />
//               <span>{item.label}</span>
//             </Link>
//           );
//         })}
//       </nav>
//       <div className="sidebar-profile">
//         <div className="sidebar-profile-content">
//           <div className="sidebar-profile-avatar">JD</div>
//           <p className="sidebar-profile-name">John Doe</p>
//         </div>
//       </div>
//     </aside>
//   );
// }

'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  Settings,
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


export function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    return href === '/dashboard' ? pathname === href : pathname.startsWith(href);
  };


  const sidebarClassName = `sidebar ${isOpen ? 'open' : ''}`;

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
      </nav>
      <div className="sidebar-profile">
        <div className="sidebar-profile-content">
          <div className="sidebar-profile-avatar">JD</div>
          <p className="sidebar-profile-name">John Doe</p>
        </div>
      </div>
    </aside>
  );
}