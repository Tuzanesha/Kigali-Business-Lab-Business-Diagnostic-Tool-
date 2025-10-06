'use client';

import React, { useState } from 'react';
import styles from './assessment.module.css';
import { Check, UploadCloud, File as FileIcon, X, AlertTriangle, ChevronDown, Download } from 'lucide-react';
import Link from 'next/link';

interface CategoryItemProps {
  title: string;
  score: number;
  children: React.ReactNode;
}

interface AssessmentReportProps {
  onRetake: () => void;
}


const steps = ['Leadership', 'Organisation', 'Sales', 'Financials'];
const questionsForStep = {
  'Leadership': [
    { id: 'l1', text: 'How effectively does the leadership team communicate the company vision?', score: 0, options: ['None', 'Very little', 'Some', 'Good', 'Excellent'] },
    { id: 'l2', text: 'To what extent does leadership demonstrate accountability?', score: 0, options: ['None', 'Very little', 'Some', 'Good', 'Excellent'] },
    { id: 'l3', text: 'How well does the team foster innovation and creative problem-solving?', score: 0, options: ['None', 'Very little', 'Some', 'Good', 'Excellent'] },
  ],
  'Organisation': [
    { id: 'o1', text: 'Are roles and responsibilities clearly defined across the company?', score: 0, options: ['None', 'Very little', 'Some', 'Good', 'Excellent'] },
    { id: 'o2', text: 'Is there an effective process for onboarding new employees?', score: 0, options: ['None', 'Very little', 'Some', 'Good', 'Excellent'] },
  ],
  'Sales': [
    { id: 's1', text: 'Is the sales process well-documented and consistently followed?', score: 0, options: ['None', 'Very little', 'Some', 'Good', 'Excellent'] },
  ],
  'Financials': [
    { id: 'f1', text: 'Are financial reports generated accurately and on a regular schedule?', score: 0, options: ['None', 'Very little', 'Some', 'Good', 'Excellent'] },
  ],
};


const FileUpload = ({ file, onFileChange, onFileRemove }: { file: File | null, onFileChange: (file: File) => void, onFileRemove: () => void }) => {
    const [isDragging, setIsDragging] = useState(false);
    const uniqueId = React.useId(); 
    const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items?.length > 0) setIsDragging(true); };
    const handleDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.length > 0) { onFileChange(e.dataTransfer.files[0]); e.dataTransfer.clearData(); } };
    
    if (file) {
        return <div className={styles['file-preview']}><div className={styles['file-info']}><FileIcon size={32} /><div><p className={styles['file-name']}>{file.name}</p><p className={styles['file-size']}>{(file.size / 1024).toFixed(1)} KB</p></div></div><button onClick={onFileRemove} className={styles['remove-file-button']}><X size={18} /></button></div>;
    }
    return <div onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop} className={`${styles['upload-zone']} ${isDragging ? styles.active : ''}`}><input type="file" id={uniqueId} hidden onChange={(e) => e.target.files && onFileChange(e.target.files[0])} /><label htmlFor={uniqueId} style={{ cursor: 'pointer' }}><UploadCloud className={styles['upload-icon']} size={40} /><p className={styles['upload-text-main']}>Drag & drop evidence, or click to browse</p><p className={styles['upload-text-sub']}>Supports PDF, DOCX, etc.</p></label></div>;
};


const Question = ({ question, answer, onAnswerChange }: { question: {id: string, text: string, options: string[]}, answer: number, onAnswerChange: (id: string, value: number) => void }) => {
  const [showGuidance, setShowGuidance] = useState(false);
  return (
    <div className={styles.question}>
      <div className={styles['question-header']}><div className={styles['question-number']}>Q</div><div><p className={styles['question-text']}>{question.text}</p><p className={styles['question-subtext']}>Grade this question</p></div></div>
      <div className={styles['radio-group']}>{question.options.map((opt, i) => (<div key={i} className={styles['radio-item']}><input type="radio" id={`${question.id}-${i}`} name={question.id} value={i} checked={answer === i} onChange={() => onAnswerChange(question.id, i)} className={styles['radio-input']} /><label htmlFor={`${question.id}-${i}`} className={styles['radio-label']}>0{i} <br /> {opt}</label></div>))}</div>
      <button onClick={() => setShowGuidance(!showGuidance)} className={styles['guidance-toggle']}>{showGuidance ? 'Hide' : 'Show'} Guidance & Add Comment</button>
      {showGuidance && <textarea className={styles['comment-textarea']} placeholder="Add your comments..."></textarea>}
    </div>
  );
};


const AssessmentWizard = ({ onComplete, onExit }: { onComplete: () => void, onExit: () => void }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: number}>({});
  

  const [files, setFiles] = useState<{[key: string]: File | null}>({});

  const currentStepName = steps[currentStepIndex];
  const questions = questionsForStep[currentStepName as keyof typeof questionsForStep] || [];

  const handleNext = () => { if (currentStepIndex < steps.length - 1) { setCurrentStepIndex(currentStepIndex + 1); } else { onComplete(); } };
  const handlePrev = () => { if (currentStepIndex > 0) { setCurrentStepIndex(currentStepIndex - 1); } };

 
  const handleFileChange = (file: File) => {
    setFiles(prevFiles => ({
        ...prevFiles,
        [currentStepName]: file
    }));
  };
  const handleFileRemove = () => {
    setFiles(prevFiles => ({
        ...prevFiles,
        [currentStepName]: null
    }));
  };

  return (
    <div className={styles['wizard-page']}>
      <header className={styles['page-header']}><h1 className={styles['page-title']}>NEW ASSESSMENT</h1></header>
      <div className={styles['stepper-card']}>
        <div className={styles['stepper-header']}><p className={styles['stepper-title']}>PROGRESS</p><p className={styles['stepper-progress']}>Step {currentStepIndex} of {steps.length - 1}</p></div>
        <div className={styles['stepper-track']}>{steps.map((step, index) => (<div key={step} className={`${styles.step} ${index === currentStepIndex ? styles.active : ''} ${index < currentStepIndex ? styles.completed : ''}`}><div className={styles['step-circle']}>{index < currentStepIndex ? <Check size={14} /> : index}</div><p className={styles['step-label']}>{step}</p></div>))}</div>
      </div>
      <div className={styles['questions-card']}>
        <div className={styles['questions-header']}><h2 className={styles['questions-title']}>SECTION {currentStepIndex}: {currentStepName.toUpperCase()}</h2><p className={styles['questions-counter']}>Questions 1-{questions.length}</p></div>
        {questions.map((q) => <Question key={q.id} question={q} answer={answers[q.id]} onAnswerChange={(id, value) => setAnswers({ ...answers, [id]: value })} />)}
        
        
        <FileUpload 
          file={files[currentStepName] || null} 
          onFileChange={handleFileChange} 
          onFileRemove={handleFileRemove} 
        />
      </div>
      <div className={styles['wizard-nav']}>
        <button onClick={handlePrev} disabled={currentStepIndex === 0} className={`${styles['nav-button']} ${styles['nav-button-secondary']}`}>Previous Section</button>
        <div>
          <button onClick={onExit} className={`${styles['nav-button']} ${styles['nav-button-tertiary']}`} style={{ marginRight: '1rem' }}>Save & Exit</button>
          <button onClick={handleNext} className={`${styles['nav-button']} ${styles['nav-button-primary']}`}>{currentStepIndex === steps.length - 1 ? 'Finish & View Report' : 'Next Section'}</button>
        </div>
      </div>
    </div>
  );
};


const CategoryItem = ({ title, score, children }: CategoryItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const scoreColor = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';
    return (
        <div className={styles['category-item']}>
            <div className={styles['category-header']} onClick={() => setIsOpen(!isOpen)}>
                <div>
                    <p className={styles['category-title']}>{title}</p>
                    <div className={styles['progress-bar-bg']}><div className={styles['progress-bar-fg']} style={{ width: `${score}%`, backgroundColor: scoreColor }}></div></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={styles['category-score']} style={{color: scoreColor}}>{score}%</span>
                    <ChevronDown size={20} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </div>
            </div>
            {isOpen && <div className={styles['category-details']}>{children}</div>}
        </div>
    );
};

const AssessmentReport = ({ onRetake }: AssessmentReportProps) => {
  return (
    <div className={styles['report-page']}>
      <header className={styles['report-header']}>
        <div className={styles['report-title-section']}>
          <h1>ASSESSMENT REPORT</h1>
          <p>For Acme Dynamics Inc. - Completed on Wed, 15 Oct 2024</p>
        </div>
        <button className={`${styles['nav-button-secondary']} ${styles['nav-button']}`}><Download size={16} /> Export as PDF</button>
      </header>

      <div className={styles['report-grid']}>
        <div className={styles['report-card']}>
          <h2 className={styles['section-header']}>Overall Health Score</h2>
          <p className={styles['health-score-value']}>72%</p>
          <p className={styles['health-score-text']}>This score indicates a solid foundation with key areas for strategic improvement.</p>
        </div>
        <div className={styles['report-card']}>
          <h2 className={styles['section-header']}>Performance Overview</h2>
          <div className={styles['overview-chart']}><div className={styles['overview-placeholder']}>72%</div></div>
        </div>
      </div>

      <div className={`${styles['report-card']} ${styles['grid-col-span-2']}`}>
        <h2 className={styles['section-header']}><AlertTriangle size={20} /> PRIORITY FOCUS AREAS</h2>
        <div>
            <div className={styles['focus-item']}><p className={styles['focus-item-title']}>Financials <span className={`${styles['priority-tag']} ${styles['priority-new']}`}>NEW</span></p>
            <Link href="/action-plan/add" className={`${styles['nav-button-primary']} ${styles['nav-button']}`}>
                    Add to Action Plan
                </Link>
            </div>
            <div className={styles['focus-item']}><p className={styles['focus-item-title']}>Sales <span className={`${styles['priority-tag']} ${styles['priority-new']}`}>NEW</span></p>
            <Link href="/action-plan/add" className={`${styles['nav-button-primary']} ${styles['nav-button']}`}>
                    Add to Action Plan
                </Link>
            </div>
        </div>
      </div>
      
      <div className={`${styles['report-card']} ${styles['grid-col-span-2']}`}>
        <h2 className={styles['section-header']}>CATEGORY DEEP DIVE</h2>
        <CategoryItem title="Leadership" score={85}>
            <div className={styles['detail-item']}><p className={styles['detail-question']}>Q: How effectively does leadership communicate vision?</p><p className={styles['detail-answer']}>Score: 4/4 (Excellent) - Comment: Communication is clear.</p></div>
        </CategoryItem>
        <CategoryItem title="Sales" score={45}>
            <div className={styles['detail-item']}><p className={styles['detail-question']}>Q: Is the sales process well-documented?</p><p className={styles['detail-answer']}>Score: 2/4 (Some) - Comment: Documentation is outdated.</p></div>
        </CategoryItem>
      </div>

      <button onClick={onRetake} className={`${styles['nav-button']} ${styles['nav-button-primary']}`}>Start New Assessment</button>
    </div>
  );
};


export default function AssessmentPageController() {
  const [view, setView] = useState<'assessment' | 'report'>('assessment');

  const handleStartOver = () => {
      setView('assessment');
      
  };

  return (
    <div className={styles['assessment-container']}>
      {view === 'assessment' ? (
    
        <AssessmentWizard
          onComplete={() => setView('report')}
          onExit={() => setView('assessment')} 
        />
      ) : (
        <AssessmentReport onRetake={handleStartOver} />
      )}
    </div>
  );
}