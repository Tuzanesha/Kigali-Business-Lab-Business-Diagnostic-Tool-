'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  FileText,
  MessageSquare,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { teamApi, getAccessToken } from '../../../lib/api';
import styles from './team-portal.module.css';

interface ActionItem {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string | null;
  progress_percentage: number;
  notes_count: number;
  documents_count: number;
}

interface Enterprise {
  enterprise_id: number;
  enterprise_name: string;
  role: string;
  joined_at: string | null;
  assigned_actions: ActionItem[];
  total_assigned: number;
  completed: number;
  in_progress: number;
  todo: number;
}

interface PortalData {
  user: {
    id: number;
    email: string;
    full_name: string;
  };
  enterprises: Enterprise[];
  total_enterprises: number;
}

export default function TeamPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);

  useEffect(() => {
    const loadPortal = async () => {
      const access = getAccessToken();
      if (!access) {
        router.push('/login');
        return;
      }

      const tid = toast.loading('Loading your portal...');
      try {
        const portalData = await teamApi.getPortal(access);
        setData(portalData);
        toast.success('Portal loaded', { id: tid, duration: 1500 });
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load portal', { id: tid });
        if (e?.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPortal();
  }, [router]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#64748b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} className={styles.completedIcon} />;
      case 'inprogress': return <Clock size={16} className={styles.inProgressIcon} />;
      default: return <AlertCircle size={16} className={styles.todoIcon} />;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your portal...</p>
      </div>
    );
  }

  if (!data || data.enterprises.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Building2 size={64} className={styles.emptyIcon} />
        <h2>No Team Memberships</h2>
        <p>You haven&apos;t been added to any team yet. Check your email for an invitation link.</p>
        <Link href="/dashboard" className={styles.primaryButton}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.portalPage}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>TEAM PORTAL</h1>
          <p className={styles.welcomeText}>Welcome, {data.user.full_name}</p>
        </div>
      </header>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dbeafe' }}>
            <Building2 size={24} style={{ color: '#2563eb' }} />
          </div>
          <div>
            <p className={styles.statValue}>{data.total_enterprises}</p>
            <p className={styles.statLabel}>Teams</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef3c7' }}>
            <Clock size={24} style={{ color: '#d97706' }} />
          </div>
          <div>
            <p className={styles.statValue}>
              {data.enterprises.reduce((sum, e) => sum + e.in_progress, 0)}
            </p>
            <p className={styles.statLabel}>In Progress</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dcfce7' }}>
            <CheckCircle2 size={24} style={{ color: '#16a34a' }} />
          </div>
          <div>
            <p className={styles.statValue}>
              {data.enterprises.reduce((sum, e) => sum + e.completed, 0)}
            </p>
            <p className={styles.statLabel}>Completed</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fee2e2' }}>
            <AlertCircle size={24} style={{ color: '#dc2626' }} />
          </div>
          <div>
            <p className={styles.statValue}>
              {data.enterprises.reduce((sum, e) => sum + e.todo, 0)}
            </p>
            <p className={styles.statLabel}>To Do</p>
          </div>
        </div>
      </div>

      {/* Enterprise Sections */}
      {data.enterprises.map((enterprise) => (
        <div key={enterprise.enterprise_id} className={styles.enterpriseSection}>
          <div className={styles.enterpriseHeader}>
            <div className={styles.enterpriseInfo}>
              <Building2 size={24} className={styles.enterpriseIcon} />
              <div>
                <h2 className={styles.enterpriseName}>{enterprise.enterprise_name}</h2>
                <span className={styles.roleTag}>{enterprise.role}</span>
              </div>
            </div>
            <div className={styles.enterpriseStats}>
              <span className={styles.statBadge} style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                {enterprise.in_progress} In Progress
              </span>
              <span className={styles.statBadge} style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                {enterprise.completed} Completed
              </span>
            </div>
          </div>

          {enterprise.assigned_actions.length === 0 ? (
            <div className={styles.noActions}>
              <p>No action items assigned to you yet.</p>
            </div>
          ) : (
            <div className={styles.actionsList}>
              {enterprise.assigned_actions.map((action) => (
                <Link 
                  href={`/team-portal/action/${action.id}`} 
                  key={action.id} 
                  className={styles.actionCard}
                >
                  <div className={styles.actionHeader}>
                    <div className={styles.actionStatus}>
                      {getStatusIcon(action.status)}
                      <span className={styles.statusLabel}>
                        {action.status === 'completed' ? 'Completed' : 
                         action.status === 'inprogress' ? 'In Progress' : 'To Do'}
                      </span>
                    </div>
                    <span 
                      className={styles.priorityBadge}
                      style={{ backgroundColor: getPriorityColor(action.priority) }}
                    >
                      {action.priority}
                    </span>
                  </div>
                  
                  <h3 className={styles.actionTitle}>{action.title}</h3>
                  {action.description && (
                    <p className={styles.actionDescription}>{action.description}</p>
                  )}
                  
                  <div className={styles.actionProgress}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ width: `${action.progress_percentage}%` }}
                      />
                    </div>
                    <span className={styles.progressText}>{action.progress_percentage}%</span>
                  </div>
                  
                  <div className={styles.actionFooter}>
                    <div className={styles.actionMeta}>
                      {action.due_date && (
                        <span className={styles.metaItem}>
                          <Calendar size={14} />
                          {new Date(action.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <span className={styles.metaItem}>
                        <MessageSquare size={14} />
                        {action.notes_count} notes
                      </span>
                      <span className={styles.metaItem}>
                        <FileText size={14} />
                        {action.documents_count} files
                      </span>
                    </div>
                    <ChevronRight size={20} className={styles.chevron} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


