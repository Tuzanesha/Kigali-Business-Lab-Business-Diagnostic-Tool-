'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import styles from './assessment.module.css';
import { Check, UploadCloud, File as FileIcon, X, AlertTriangle, ChevronDown, Download } from 'lucide-react';
import { catalogApi, enterpriseApi, getAccessToken } from '../../../../lib/api';

interface CategoryItemProps {
  title: string;
  score: number;
  children: React.ReactNode;
}
interface AssessmentReportProps {
  enterpriseId: number;
  onRetake: () => void;
}
// Will load from API
type UiQuestion = { id: string; text: string; options: string[]; backendId: number };

const FileUpload = ({ file, onFileChange, onFileRemove }: { file: File | null, onFileChange: (file: File) => void, onFileRemove: () => void }) => { const [isDragging, setIsDragging] = useState(false); const uniqueId = React.useId(); const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }; const handleDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items?.length > 0) setIsDragging(true); }; const handleDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }; const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.length > 0) { onFileChange(e.dataTransfer.files[0]); e.dataTransfer.clearData(); } }; if (file) { return <div className={styles['file-preview']}><div className={styles['file-info']}><FileIcon size={32} /><div><p className={styles['file-name']}>{file.name}</p><p className={styles['file-size']}>{(file.size / 1024).toFixed(1)} KB</p></div></div><button onClick={onFileRemove} className={styles['remove-file-button']}><X size={18} /></button></div>; } return <div onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop} className={`${styles['upload-zone']} ${isDragging ? styles.active : ''}`}><input type="file" id={uniqueId} hidden onChange={(e) => e.target.files && onFileChange(e.target.files[0])} /><label htmlFor={uniqueId} style={{ cursor: 'pointer' }}><UploadCloud className={styles['upload-icon']} size={40} /><p className={styles['upload-text-main']}>Drag & drop evidence, or click to browse</p><p className={styles['upload-text-sub']}>Supports PDF, DOCX, etc.</p></label></div>; };
const Question = ({ question, answer, onAnswerChange }: { question: {id: string, text: string, options: string[]}, answer: number, onAnswerChange: (id: string, value: number) => void }) => { const [showGuidance, setShowGuidance] = useState(false); return ( <div className={styles.question}><div className={styles['question-header']}><div className={styles['question-number']}>Q</div><div><p className={styles['question-text']}>{question.text}</p><p className={styles['question-subtext']}>Grade this question</p></div></div><div className={styles['radio-group']}>{question.options.map((opt, i) => (<div key={i} className={styles['radio-item']}><input type="radio" id={`${question.id}-${i}`} name={question.id} value={i} checked={answer === i} onChange={() => onAnswerChange(question.id, i)} className={styles['radio-input']} /><label htmlFor={`${question.id}-${i}`} className={styles['radio-label']}>0{i} <br /> {opt}</label></div>))}</div><button onClick={() => setShowGuidance(!showGuidance)} className={styles['guidance-toggle']}>{showGuidance ? 'Hide' : 'Show'} Guidance & Add Comment</button>{showGuidance && <textarea className={styles['comment-textarea']} placeholder="Add your comments..."></textarea>}</div> ); };

const AssessmentWizard = ({ enterpriseId, onComplete, onExit }: { enterpriseId: number, onComplete: () => void, onExit: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<string[]>([]);
  const [questionsByStep, setQuestionsByStep] = useState<Record<string, UiQuestion[]>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: string]: number}>({});
  const [files, setFiles] = useState<{[key: string]: File | null}>({});
  const currentStepName = steps[currentStepIndex] || '';
  const questions = (questionsByStep[currentStepName] || []);

  useEffect(() => {
    const load = async () => {
      const id = toast.loading('Loading assessment...');
      try {
        const access = getAccessToken();
        if (!access) throw new Error('Unauthorized');
        // Load categories
        const cats = await catalogApi.getCategories(access);
        const names: string[] = (Array.isArray(cats) ? cats : cats?.results || []).map((c: any) => c.name);
        setSteps(names);
        // Load questions per category
        const byStep: Record<string, UiQuestion[]> = {};
        for (const name of names) {
          const qres = await catalogApi.getQuestions(access, { category: name });
          const items: any[] = Array.isArray(qres) ? qres : qres?.results || [];
          byStep[name] = items.map((q: any) => ({
            id: String(q.id),
            backendId: q.id,
            text: q.text,
            options: [0,1,2,3,4].map((k) => q.descriptors?.[String(k)] ?? String(k)),
          }));
        }
        setQuestionsByStep(byStep);
        setLoading(false);
        toast.success('Assessment loaded', { id });
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load assessment', { id });
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      const submit = async () => {
        const access = getAccessToken();
        if (!access) throw new Error('Unauthorized');
        // Flatten all questions and answers
        const payload: Array<{question_id: number; score: number; evidence?: string; comments?: string;}> = [];
        for (const stepName of steps) {
          for (const q of (questionsByStep[stepName] || [])) {
            const score = answers[q.id];
            if (typeof score === 'number') {
              payload.push({ question_id: q.backendId, score });
            }
          }
        }
        await enterpriseApi.submitAnswers(access, enterpriseId, payload);
        await enterpriseApi.recompute(access, enterpriseId);
        // Optionally fetch report to confirm
        try { await enterpriseApi.getReport(access, enterpriseId); } catch {}
      };
      toast.promise(submit(), {
        loading: 'Finalizing assessment...',
        success: 'Report generated successfully!',
        error: 'Could not complete assessment.'
      }, {
        duration: 3000,
        success: {
          duration: 2500,
        },
        error: {
          duration: 4000,
        },
      }).then(() => onComplete());
    }
  };

  const handlePrev = () => { if (currentStepIndex > 0) { setCurrentStepIndex(currentStepIndex - 1); } };
  const handleFileChange = (file: File) => { setFiles(prevFiles => ({ ...prevFiles, [currentStepName]: file })); };
  const handleFileRemove = () => { setFiles(prevFiles => ({ ...prevFiles, [currentStepName]: null })); };

  if (loading) {
    return <div className={styles['wizard-page']}><header className={styles['page-header']}><h1 className={styles['page-title']}>NEW ASSESSMENT</h1></header><div className={styles['questions-card']}>Loading...</div></div>;
  }

  return ( <div className={styles['wizard-page']}><header className={styles['page-header']}><h1 className={styles['page-title']}>NEW ASSESSMENT</h1></header><div className={styles['stepper-card']}><div className={styles['stepper-header']}><p className={styles['stepper-title']}>PROGRESS</p><p className={styles['stepper-progress']}>Step {currentStepIndex + 1} of {steps.length }</p></div><div className={styles['stepper-track']}>{steps.map((step, index) => (<div key={step} className={`${styles.step} ${index === currentStepIndex ? styles.active : ''} ${index < currentStepIndex ? styles.completed : ''}`}><div className={styles['step-circle']}>{index < currentStepIndex ? <Check size={14} /> : index + 1}</div><p className={styles['step-label']}>{step}</p></div>))}</div></div><div className={styles['questions-card']}><div className={styles['questions-header']}><h2 className={styles['questions-title']}>SECTION {currentStepIndex + 1}: {currentStepName.toUpperCase()}</h2><p className={styles['questions-counter']}>Questions 1-{questions.length}</p></div>{questions.map((q) => <Question key={q.id} question={q} answer={answers[q.id]} onAnswerChange={(id, value) => setAnswers({ ...answers, [id]: value })} />)}<FileUpload file={files[currentStepName] || null} onFileChange={handleFileChange} onFileRemove={handleFileRemove} /></div><div className={styles['wizard-nav']}><button onClick={handlePrev} disabled={currentStepIndex === 0} className={`${styles['nav-button']} ${styles['nav-button-secondary']}`}>Previous Section</button><div><button onClick={onExit} className={`${styles['nav-button']} ${styles['nav-button-tertiary']}`} style={{ marginRight: '1rem' }}>Save & Exit</button><button onClick={handleNext} className={`${styles['nav-button']} ${styles['nav-button-primary']}`}>{currentStepIndex === steps.length - 1 ? 'Finish & View Report' : 'Next Section'}</button></div></div></div> );
};

const CategoryItem = ({ title, score, children }: CategoryItemProps) => { const [isOpen, setIsOpen] = useState(false); const scoreColor = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'; return ( <div className={styles['category-item']}><div className={styles['category-header']} onClick={() => setIsOpen(!isOpen)}><div><p className={styles['category-title']}>{title}</p><div className={styles['progress-bar-bg']}><div className={styles['progress-bar-fg']} style={{ width: `${score}%`, backgroundColor: scoreColor }}></div></div></div><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span className={styles['category-score']} style={{color: scoreColor}}>{score}%</span><ChevronDown size={20} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} /></div></div>{isOpen && <div className={styles['category-details']}>{children}</div>}</div> ); };

const AssessmentReport = ({ enterpriseId, onRetake }: AssessmentReportProps) => {
  const router = useRouter();
  
  const [overall, setOverall] = useState<number>(0);
  const [sections, setSections] = useState<Record<string, { percentage: number }>>({});
  const [focus, setFocus] = useState<Array<{ code: string; priority: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const tid = 'report-load';
      toast.dismiss(tid);
      toast.loading('Loading report...', { id: tid });
      try {
        const access = getAccessToken();
        if (!access) throw new Error('Unauthorized');
        const rep = await enterpriseApi.getReport(access, enterpriseId);
        setOverall(Number(rep?.overall_percentage || 0));
        setSections(rep?.section_scores || {});
        const pr = rep?.priorities || {};
        const items = Object.entries(pr)
          .filter(([_, v]: any) => (v?.action_required === 'Y'))
          .map(([code, v]: any) => ({ code: String(code), priority: Number(v?.priority || 0) }))
          .sort((a, b) => a.priority - b.priority)
          .slice(0, 10);
        setFocus(items);
        setLoading(false);
        toast.success('Report loaded', { id: tid, duration: 2000 });
      } catch (e: any) {
        setLoading(false);
        toast.error(e?.message || 'Failed to load report', { id: 'report-load', duration: 4000 });
      }
    };
    load();
  }, [enterpriseId]);

  const handleAddToActionPlan = (itemName: string) => {
    const tid = 'report-nav';
    toast.dismiss(tid);
    const navigationPromise = new Promise<void>(resolve => setTimeout(resolve, 800));
    toast.loading(`Adding ${itemName} to Action Plan...`, { id: tid });
    navigationPromise.then(() => {
      toast.success('Redirecting...', { id: tid, duration: 1200 });
      router.push('/action-plan/add');
    });
  };

  if (loading) {
    return <div className={styles['report-page']}><div className={styles['report-card']}>Loading...</div></div>;
  }

  return (
    <div className={styles['report-page']}>
      <header className={styles['report-header']}>
        <div className={styles['report-title-section']}><h1>ASSESSMENT REPORT</h1><p>Enterprise #{enterpriseId}</p></div>
        <button className={`${styles['nav-button-secondary']} ${styles['nav-button']}`}><Download size={16} /> Export as PDF</button>
      </header>
      <div className={styles['report-grid']}>
        <div className={styles['report-card']}>
          <h2 className={styles['section-header']}>Overall Health Score</h2>
          <p className={styles['health-score-value']}>{Math.round(overall)}%</p>
          <p className={styles['health-score-text']}>Computed from your latest submitted answers.</p>
        </div>
        <div className={styles['report-card']}>
          <h2 className={styles['section-header']}>Performance Overview</h2>
          <div className={styles['overview-chart']}>
            <div className={styles['overview-placeholder']}>{Math.round(overall)}%</div>
          </div>
        </div>
      </div>
      <div className={`${styles['report-card']} ${styles['grid-col-span-2']}`}>
        <h2 className={styles['section-header']}><AlertTriangle size={20} /> PRIORITY FOCUS AREAS</h2>
        <div>
          {focus.length === 0 && (
            <div className={styles['detail-item']}><p>No immediate priorities detected.</p></div>
          )}
          {focus.map((f) => (
            <div key={f.code} className={styles['focus-item']}>
              <p className={styles['focus-item-title']}>Question {f.code} <span className={`${styles['priority-tag']} ${styles['priority-new']}`}>P{f.priority}</span></p>
              <button onClick={() => handleAddToActionPlan(`Question ${f.code}`)} className={`${styles['nav-button-primary']} ${styles['nav-button']}`}>Add to Action Plan</button>
            </div>
          ))}
        </div>
      </div>
      <div className={`${styles['report-card']} ${styles['grid-col-span-2']}`}>
        <h2 className={styles['section-header']}>CATEGORY DEEP DIVE</h2>
        {Object.entries(sections).map(([name, v]: any) => (
          <CategoryItem key={name} title={name} score={Number(v?.percentage || 0)}>
            <div className={styles['detail-item']}>
              <p className={styles['detail-question']}>Weighted {Number(v?.weighted || 0)} / Perfect {Number(v?.perfect || 0)}</p>
              <p className={styles['detail-answer']}>Score: {Number(v?.percentage || 0)}%</p>
            </div>
          </CategoryItem>
        ))}
      </div>
    </div>
  );
};

export default function AssessmentPageController() {
  const params = useParams();
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null);
  const [view, setView] = useState<'assessment' | 'report'>('assessment');

  useEffect(() => {
    const resolve = async () => {
      const pid = params?.id as string | undefined;
      let eid: number | null = null;
      if (pid && !isNaN(Number(pid))) {
        eid = Number(pid);
      } else {
        const access = getAccessToken();
        if (access) {
          try {
            const prof = await enterpriseApi.getProfile(access);
            eid = Number(prof?.id);
          } catch {}
        }
      }
      if (eid) {
        setEnterpriseId(eid);
        // If route is /assessments/new (non-numeric id), always open the form
        if (!(pid && !isNaN(Number(pid)))) {
          setView('assessment');
        } else {
          // Numeric id: try to show report if it exists, else show form
          try {
            const access = getAccessToken();
            if (access) {
              await enterpriseApi.getReport(access, eid);
              setView('report');
            }
          } catch {
            setView('assessment');
          }
        }
      }
    };
    resolve();
  }, [params]);

  const handleStartOver = () => { setView('assessment'); };
  if (!enterpriseId) {
    return <div className={styles['assessment-container']}>Loading...</div>;
  }
  return (
    <div className={styles['assessment-container']}>
      {view === 'assessment' ? (
        <AssessmentWizard
          enterpriseId={enterpriseId}
          onComplete={() => setView('report')}
          onExit={() => setView('assessment')} 
        />
      ) : (
        <AssessmentReport enterpriseId={enterpriseId} onRetake={handleStartOver} />
      )}
    </div>
  );
}