'use client';

import { PlusCircle, Eye, Trash2 } from 'lucide-react';
import styles from './assessments.module.css';
import Link from 'next/link';

const assessmentsData = [
  { id: 1, date: 'October 25, 2023', score: '87%', status: 'completed' },
  { id: 2, date: 'July 14, 2023', score: '72%', status: 'completed' },
  { id: 3, date: 'May 01, 2023', score: '65%', status: 'completed' },
  { id: 4, date: 'March 20, 2023', score: 'N/A', status: 'in-progress' },
];

export default function AssessmentsPage() {
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
              {assessmentsData.map((assessment) => (
                <tr key={assessment.id}>
                  <td>{assessment.date}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${assessment.status === 'completed' ? styles.statusCompleted : styles.statusInProgress}`}>
                      {assessment.status}
                    </span>
                  </td>
                  <td>{assessment.score}</td>
                  <td className={styles.actionsCell}>
    {/* --- THIS IS THE FIX --- */}
    {/* Replaced the button with a Link component. */}
    {/* The href creates a dynamic URL like /assessments/1/report */}
    <Link href={`/assessments/${assessment.id}/report`} className={styles.actionButton} aria-label="View">
        <Eye height={18} width={18} />
    </Link>
    <button className={styles.actionButton} aria-label="Delete">
        <Trash2 height={18} width={18} />
    </button>
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.mobileList}>
          {assessmentsData.map((assessment) => (
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
                  <button className={styles.actionButton} aria-label="View">
                    <Eye height={20} width={20} />
                  </button>
                  <button className={styles.actionButton} aria-label="Delete">
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