'use client';

import React, { useEffect, useState } from 'react';
import { PlusCircle, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './assessments.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { assessmentApi, teamApi, enterpriseApi, getAccessToken } from '../../../lib/api';

type AssessmentItem = { 
  id: number; 
  enterpriseId: number; 
  enterprise: string; 
  date: string; 
  score: string; 
  status: 'completed'|'in-progress';
  created_at: string;
};

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    const id = toast.loading('Loading assessments...');
    try {
      const access = getAccessToken();
      if (!access) { 
        toast.dismiss(id); 
        router.push('/login'); 
        return; 
      }
      
      // Check if user is a team member - if so, redirect to team portal
      try {
        const portalData = await teamApi.getPortal(access);
        const isTeamMember = portalData.is_team_member_only === true || 
          (portalData.total_enterprises > 0 && portalData.is_owner === false);
        if (isTeamMember) {
          toast.dismiss(id);
          toast.error('Team members should use the Team Portal', { duration: 2000 });
          router.push('/team-portal');
          return;
        }
      } catch (portalError: any) {
        // If 403 with is_owner flag, user is owner - continue
        if (portalError?.status === 403 && portalError?.data?.is_owner) {
          // Owner - continue
        } else if (portalError?.status === 403 && portalError?.data?.is_team_member_only === false) {
          // New user (not team member) - continue
        } else {
          // Try to check enterprise profile to determine if owner
          try {
            await enterpriseApi.getProfile(access);
            // Can access enterprise profile - owner, continue
          } catch {
            // Can't access - might be team member, redirect
            toast.dismiss(id);
            router.push('/team-portal');
            return;
          }
        }
      }
      
      const response = await assessmentApi.getSessions(access);
      console.log('Assessment sessions response:', response);
      
      // Handle different possible response formats
      let data: any[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.results)) {
          data = response.results;
        } else if (response.data && Array.isArray(response.data)) {
          data = response.data;
        } else if (response.assessments && Array.isArray(response.assessments)) {
          data = response.assessments;
        } else {
          // If we can't find an array, try to use the response as a single item
          data = [response];
        }
      }
      
      console.log('Processed assessment sessions data:', data);
      
      const items: AssessmentItem[] = data.map((s: any) => ({
        id: s.id || 0,
        enterpriseId: (s.enterprise?.id || s.enterprise_id) || 0,
        enterprise: s.enterprise?.name || s.enterprise_name || 'Unknown Enterprise',
        date: s.created_at ? new Date(s.created_at).toLocaleString() : '—',
        score: (s.overall_percentage !== null && s.overall_percentage !== undefined) 
          ? `${Math.round(s.overall_percentage)}%` 
          : 'N/A',
        status: (s.overall_percentage !== null && s.overall_percentage !== undefined) 
          ? 'completed' 
          : 'in-progress',
        created_at: s.created_at || new Date().toISOString(),
      }));
      
      setAssessments(items);
      toast.dismiss(id);
      // Show a subtle success message only if there are assessments
      if (items.length > 0) {
        toast.success(`Loaded ${items.length} assessment${items.length === 1 ? '' : 's'}`, { duration: 2000 });
      }
    } catch (e: any) {
      console.error('Error loading assessments:', {
        message: e.message,
        stack: e.stack,
        response: e.response
      });
      toast.error(e?.message || 'Could not load assessments.', { id, duration: 4000 });
    }
  };

  const handleDelete = async (assessmentId: number) => {
    if (window.confirm('Are you sure you want to delete this assessment session? This action cannot be undone.')) {
      const id = toast.loading('Deleting assessment session...');
      try {
        const access = getAccessToken();
        if (!access) {
          toast.dismiss(id);
          router.push('/login');
          return;
        }

        console.log('Attempting to delete assessment session:', assessmentId);
        console.log('Access token:', access ? 'Present' : 'Missing');
        
        await assessmentApi.deleteSession(access, assessmentId);
        
        // Update local state to remove the deleted assessment session
        setAssessments(prev => {
          const updated = prev.filter(a => a.id !== assessmentId);
          console.log('Updated assessments list:', updated);
          return updated;
        });
        
        toast.success('Assessment session deleted successfully', { id, duration: 2500 });
      } catch (error: any) {
        console.error('Error deleting assessment session:', {
          message: error.message,
          stack: error.stack,
          response: error.response
        });
        toast.error(error.message || 'Failed to delete assessment session', { id, duration: 4000 });
      }
    }
  };

  return (
    <div>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>ASSESSMENTS</h1>
        <Link href="/assessments/new" className={styles.newAssessmentButton}>
          <PlusCircle height={20} width={20} />
          <span>Start New Assessment</span>
        </Link>
      </header>

      <div className={styles.mainCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Assessment Date</th>
                <th>Enterprise</th>
                <th>Status</th>
                <th>Overall Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assessments.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    No assessments found. Click "Start New Assessment" to begin.
                  </td>
                </tr>
              ) : (
                assessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>{assessment.date}</td>
                    <td>{assessment.enterprise}</td>
                    <td>
                      <span 
                        className={`${styles.statusBadge} ${
                          assessment.status === 'completed' 
                            ? styles.statusCompleted 
                            : styles.statusInProgress
                        }`}
                      >
                        {assessment.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td>{assessment.score}</td>
                    <td className={styles.actionsCell}>
                      <Link 
                        href={`/assessments/${assessment.enterpriseId}`} 
                        className={styles.actionButton} 
                        aria-label="View"
                      >
                        <Eye height={18} width={18} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(assessment.id)} 
                        className={styles.actionButton} 
                        aria-label="Delete"
                      >
                        <Trash2 height={18} width={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}