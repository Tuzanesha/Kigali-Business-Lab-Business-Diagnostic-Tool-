
'use client';

import React, { useState } from 'react';
import { Sidebar } from '..//../components/layout/sidebar'
import '../../styles/app-layout.css';
import { Menu} from 'lucide-react'; 
import Image from 'next/image';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  

  return (
    <div className="app-layout">

      
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

     
      <main className="main-content">
        
        <header className="mobile-header">
          <Image src="/kbl-logo-blue.png" alt="KBL Logo" width={60} height={30} />
          <button onClick={toggleSidebar} className="hamburger-button">
            <Menu className="h-6 w-6" />
          </button>
        </header>
        {children}
      </main>

      
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
        onClick={toggleSidebar}
      ></div>
    </div>
  );
}