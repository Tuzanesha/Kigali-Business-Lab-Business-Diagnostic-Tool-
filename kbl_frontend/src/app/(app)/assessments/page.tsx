'use client';

import React, { useEffect, useState } from 'react';
import { PlusCircle, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './assessments.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiMySummaries } from '../../../lib/api';

type AssessmentItem = { id: number; date: string; score: string; status: 'completed'|'in-progress' };

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const id = toast.loading('Loading assessments...');
      try {
        const access = localStorage.getItem('access');
        if (!access) { toast.dismiss(id); router.push('/login'); return; }
        const data = await apiMySummaries(access);
        const items: AssessmentItem[] = (data?.results || []).map((r: any) => ({
          id: r.id,
          date: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—',
          score: typeof r.overall_percentage === 'number' ? `${Math.round(r.overall_percentage)}%` : 'N/A',
          status: r.has_responses ? 'completed' : 'in-progress',
        }));
        setAssessments(items);
        toast.success('Assessments loaded', { id });
      } catch (e:any) {
        toast.error(e?.message || 'Could not load assessments.', { id });
      }
    };
    load();
  }, [router]);

  const handleDelete = (assessmentId: number) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      const deletePromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          setAssessments(prev => prev.filter(assessment => assessment.id !== assessmentId));
          resolve();
        }, 1000);
      });

      toast.promise(deletePromise, {
        loading: 'Deleting assessment...',
        success: 'Assessment deleted successfully.',
        error: 'Could not delete assessment.',
      });
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
                <th>Status</th>
                <th>Overall Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => (
                <tr key={assessment.id}>
                  <td>{assessment.date}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${assessment.status === 'completed' ? styles.statusCompleted : styles.statusInProgress}`}>
                      {assessment.status}
                    </span>
                  </td>
                  <td>{assessment.score}</td>
                  <td className={styles.actionsCell}>
                    <Link href={`/assessments/${assessment.id}`} className={styles.actionButton} aria-label="View">
                      <Eye height={18} width={18} />
                    </Link>
                    <button onClick={() => handleDelete(assessment.id)} className={styles.actionButton} aria-label="Delete">
                      <Trash2 height={18} width={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.mobileList}>
          {assessments.map((assessment) => (
            <div key={assessment.id} className={styles.mobileCard}>
              <div className={styles.mobileCardHeader}>
                <p className={styles.mobileCardDate}>{assessment.date}</p>
                <span className={`${styles.statusBadge} ${assessment.status === 'completed' ? styles.statusCompleted : styles.statusInProgress}`}>
                  {assessment.status}
                </span>
              </div>
              <div className={styles.mobileCardBody}>
                <p className={styles.mobileCardScore}>{assessment.score}</p>
                <div className={styles.actionsCell}>
                  <Link href={`/assessments/${assessment.id}`} className={styles.actionButton} aria-label="View">
                    <Eye height={20} width={20} />
                  </Link>
                  <button onClick={() => handleDelete(assessment.id)} className={styles.actionButton} aria-label="Delete">
                    <Trash2 height={20} width={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}