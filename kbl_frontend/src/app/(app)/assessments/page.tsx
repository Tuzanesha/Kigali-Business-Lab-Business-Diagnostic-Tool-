'use client';

import React, { useState } from 'react';
import { PlusCircle, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './assessments.module.css';
import Link from 'next/link';

const initialAssessmentsData = [
  { id: 1, date: 'October 25, 2023', score: '87%', status: 'completed' },
  { id: 2, date: 'July 14, 2023', score: '72%', status: 'completed' },
  { id: 3, date: 'May 01, 2023', score: '65%', status: 'completed' },
  { id: 4, date: 'March 20, 2023', score: 'N/A', status: 'in-progress' },
];

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState(initialAssessmentsData);

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
                    <Link href={`/assessments/${assessment.id}/report`} className={styles.actionButton} aria-label="View">
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
                  <Link href={`/assessments/${assessment.id}/report`} className={styles.actionButton} aria-label="View">
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