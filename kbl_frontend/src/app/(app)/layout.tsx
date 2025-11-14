
'use client';

import React, { useState } from 'react';
import { Sidebar } from '..//../components/layout/sidebar'
import '../../styles/app-layout.css';
import { Menu} from 'lucide-react'; 
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';

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

      <Toaster 
        position="top-center"
        toastOptions={{

          duration: 3000,


          style: {
            background: '#1168d9', 
            color: '#fff',          
            fontFamily: "'Inter', sans-serif", 
            borderRadius: '0.5rem', 
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', 
          },


          success: {
            duration: 2000, 
            iconTheme: {
              primary: '#10b981', 
              secondary: '#fff',   
            },
          },
          

          error: {
            duration: 4000, 
            iconTheme: {
              primary: '#ef4444', 
              secondary: '#fff',   
            },
          },
          

          loading: {
             iconTheme: {
              primary: '#1168d9', 
              secondary: '#e0f2fe', 
            },
          },
        }}
      />
      
      
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