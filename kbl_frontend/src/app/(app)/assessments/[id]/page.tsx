'use client';

import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import styles from './assessment.module.css';
import { Check, UploadCloud, File as FileIcon, X, AlertTriangle, ChevronDown, Download, Lightbulb, TrendingUp } from 'lucide-react';
import { catalogApi, enterpriseApi, getAccessToken } from '../../../../lib/api';

// Category-specific advice for improving scores
const CATEGORY_ADVICE: Record<string, { tips: string[]; resources: string[] }> = {
  'LEADERSHIP': {
    tips: [
      'Develop a clear vision and mission statement that aligns with your business goals',
      'Implement regular team meetings to improve communication and alignment',
      'Create leadership development programs for key team members',
      'Establish clear decision-making processes and delegate responsibilities',
      'Set measurable goals and track progress with regular reviews'
    ],
    resources: ['Leadership training workshops', 'Executive coaching programs', 'Strategic planning sessions']
  },
  'ORGANISATION & STAFF': {
    tips: [
      'Document key processes and create standard operating procedures (SOPs)',
      'Implement a structured onboarding program for new employees',
      'Conduct regular performance reviews and provide constructive feedback',
      'Invest in employee training and professional development',
      'Create clear job descriptions and organizational charts'
    ],
    resources: ['HR management tools', 'Employee engagement surveys', 'Training platforms']
  },
  'PRODUCT & PROCESSING': {
    tips: [
      'Implement quality control measures at each stage of production',
      'Regularly gather customer feedback to improve product quality',
      'Optimize production processes to reduce waste and increase efficiency',
      'Invest in equipment maintenance and upgrades when needed',
      'Document and standardize production procedures'
    ],
    resources: ['Quality management systems', 'Lean manufacturing training', 'Process optimization consultants']
  },
  'SERVICE DEVELOPMENT & DELIVERY': {
    tips: [
      'Map the customer journey to identify pain points and improvement areas',
      'Train staff on customer service best practices',
      'Implement a system for tracking and resolving customer complaints',
      'Regularly measure customer satisfaction through surveys',
      'Create service standards and ensure consistent delivery'
    ],
    resources: ['Customer service training', 'CRM software', 'Mystery shopping programs']
  },
  'MARKET ANALYSIS & MARKETING': {
    tips: [
      'Conduct regular market research to understand customer needs',
      'Develop a clear brand identity and messaging strategy',
      'Create a marketing plan with specific goals and metrics',
      'Leverage digital marketing channels effectively',
      'Monitor competitor activities and market trends'
    ],
    resources: ['Market research tools', 'Digital marketing courses', 'Brand strategy consultants']
  },
  'SALES': {
    tips: [
      'Develop a structured sales process with clear stages',
      'Train your team on consultative selling techniques',
      'Set clear sales targets and track performance metrics',
      'Build and maintain a healthy sales pipeline',
      'Focus on customer relationship building for repeat business'
    ],
    resources: ['Sales training programs', 'CRM implementation', 'Sales coaching']
  },
  'FINANCIAL PLANNING & MANAGEMENT': {
    tips: [
      'Implement proper bookkeeping and accounting systems',
      'Create monthly financial reports and review them regularly',
      'Develop cash flow projections and monitor them closely',
      'Separate personal and business finances completely',
      'Build an emergency fund for unexpected expenses'
    ],
    resources: ['Accounting software', 'Financial literacy training', 'Business finance advisors']
  },
  'LEGAL & IT': {
    tips: [
      'Ensure all business registrations and licenses are up to date',
      'Implement data backup and security measures',
      'Review and update contracts and agreements regularly',
      'Invest in appropriate technology to improve efficiency',
      'Develop IT policies for staff including cybersecurity awareness'
    ],
    resources: ['Legal compliance checklists', 'IT security audits', 'Business software solutions']
  }
};

// Get advice for a category (handles partial name matching)
const getAdviceForCategory = (categoryName: string): { tips: string[]; resources: string[] } => {
  const normalizedName = categoryName.toUpperCase().trim();
  
  // Try exact match first
  if (CATEGORY_ADVICE[normalizedName]) {
    return CATEGORY_ADVICE[normalizedName];
  }
  
  // Try partial match
  for (const key of Object.keys(CATEGORY_ADVICE)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return CATEGORY_ADVICE[key];
    }
  }
  
  // Default advice if no match found
  return {
    tips: [
      'Review your current processes and identify areas for improvement',
      'Seek feedback from customers and employees',
      'Set specific, measurable goals for improvement',
      'Consider training or consulting services in this area',
      'Benchmark against industry best practices'
    ],
    resources: ['Business development workshops', 'Industry associations', 'Mentorship programs']
  };
};

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
        
        // Use the optimized endpoint that returns ALL questions in one request
        const allQuestionsResponse = await catalogApi.getAllQuestions(access);
        
        if (allQuestionsResponse.total_questions === 0) {
          toast.error('No questions found. Please contact support.', { id });
          setLoading(false);
          return;
        }
        
        // Set categories from the response
        const categoryNames = allQuestionsResponse.categories || [];
        setSteps(categoryNames);
        
        // Transform questions by category
        const byStep: Record<string, UiQuestion[]> = {};
        const questionsByCategory = allQuestionsResponse.questions_by_category || {};
        
        for (const categoryName of categoryNames) {
          const items: any[] = questionsByCategory[categoryName] || [];
          byStep[categoryName] = items.map((q: any) => ({
            id: String(q.id),
            backendId: q.id,
            text: q.text,
            options: [0,1,2,3,4].map((k) => q.descriptors?.[String(k)] ?? String(k)),
          }));
        }
        
        setQuestionsByStep(byStep);
        setLoading(false);
        toast.success(`Loaded ${allQuestionsResponse.total_questions} questions`, { id, duration: 2000 });
      } catch (e: any) {
        console.error('Failed to load assessment:', e);
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

// Enhanced CategoryItem with advice for low scores
interface EnhancedCategoryItemProps {
  title: string;
  score: number;
  weighted?: number;
  perfect?: number;
  showAdvice?: boolean;
}

const CategoryItem = ({ title, score, weighted, perfect, showAdvice = true }: EnhancedCategoryItemProps) => { 
  const [isOpen, setIsOpen] = useState(score < 50); // Auto-expand low-scoring categories
  const scoreColor = score > 70 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score > 70 ? 'Good' : score > 50 ? 'Needs Improvement' : 'Critical';
  const advice = getAdviceForCategory(title);
  
  return ( 
    <div className={styles['category-item']}>
      <div className={styles['category-header']} onClick={() => setIsOpen(!isOpen)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <p className={styles['category-title']}>{title}</p>
            {score < 50 && (
              <span style={{ 
                backgroundColor: '#fef2f2', 
                color: '#dc2626', 
                padding: '0.125rem 0.5rem', 
                borderRadius: '9999px', 
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {scoreLabel}
              </span>
            )}
          </div>
          <div className={styles['progress-bar-bg']}>
            <div className={styles['progress-bar-fg']} style={{ width: `${score}%`, backgroundColor: scoreColor }}></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={styles['category-score']} style={{color: scoreColor}}>{Math.round(score)}%</span>
          <ChevronDown size={20} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>
      </div>
      {isOpen && (
        <div className={styles['category-details']}>
          {/* Score Details */}
          <div className={styles['detail-item']} style={{ marginBottom: '1rem' }}>
            <p className={styles['detail-question']}>
              <strong>Score Breakdown:</strong> {weighted !== undefined ? `${weighted} weighted points` : ''} 
              {perfect !== undefined ? ` / ${perfect} possible points` : ''}
            </p>
            <p className={styles['detail-answer']}>Final Score: {Math.round(score)}%</p>
          </div>
          
          {/* Advice Section - Show for scores below 70% */}
          {showAdvice && score < 70 && (
            <div style={{ 
              backgroundColor: score < 50 ? '#fef2f2' : '#fffbeb', 
              border: `1px solid ${score < 50 ? '#fecaca' : '#fde68a'}`,
              borderRadius: '0.5rem', 
              padding: '1rem',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Lightbulb size={18} style={{ color: score < 50 ? '#dc2626' : '#d97706' }} />
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: score < 50 ? '#991b1b' : '#92400e' }}>
                  {score < 50 ? 'Immediate Action Required' : 'Recommendations for Improvement'}
                </h4>
              </div>
              
              <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#374151' }}>
                {advice.tips.slice(0, score < 50 ? 5 : 3).map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{tip}</li>
                ))}
              </ul>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                <TrendingUp size={14} style={{ color: '#6b7280' }} />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Suggested resources: {advice.resources.join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div> 
  ); 
};

const AssessmentReport = ({ enterpriseId, onRetake }: AssessmentReportProps) => {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [overall, setOverall] = useState<number>(0);
  const [sections, setSections] = useState<Record<string, { percentage: number; weighted?: number; perfect?: number }>>({});
  const [focus, setFocus] = useState<Array<{ code: string; priority: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [enterpriseName, setEnterpriseName] = useState<string>('');

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
        setEnterpriseName(rep?.name || `Enterprise #${enterpriseId}`);
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

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setExporting(true);
    const tid = toast.loading('Generating PDF...');
    
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      // Create a clone of the report for PDF generation
      const reportElement = reportRef.current;
      
      // Temporarily expand all categories for PDF
      const categoryItems = reportElement.querySelectorAll('[class*="category-item"]');
      const originalStates: boolean[] = [];
      categoryItems.forEach((item, idx) => {
        const details = item.querySelector('[class*="category-details"]');
        originalStates[idx] = details ? getComputedStyle(details).display !== 'none' : false;
      });
      
      // Generate canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 30) / imgHeight);
      const imgX = 10;
      const imgY = 20;
      
      // Add header
      pdf.setFontSize(16);
      pdf.setTextColor(1, 73, 127);
      pdf.text('Kigali Business Lab - Assessment Report', pdfWidth / 2, 12, { align: 'center' });
      
      // Calculate how many pages we need
      const scaledHeight = imgHeight * ratio;
      const pageContentHeight = pdfHeight - 30; // Leave margin for header
      const totalPages = Math.ceil(scaledHeight / pageContentHeight);
      
      if (totalPages === 1) {
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      } else {
        // Multi-page PDF
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
            pdf.setFontSize(10);
            pdf.setTextColor(128, 128, 128);
            pdf.text(`Page ${page + 1} of ${totalPages}`, pdfWidth / 2, 10, { align: 'center' });
          }
          
          const sourceY = page * (pageContentHeight / ratio);
          const sourceHeight = Math.min(pageContentHeight / ratio, imgHeight - sourceY);
          
          // Create a temporary canvas for this page section
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = sourceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
            const pageImgData = pageCanvas.toDataURL('image/png');
            pdf.addImage(pageImgData, 'PNG', imgX, imgY, imgWidth * ratio, sourceHeight * ratio);
          }
        }
      }
      
      // Add footer with date
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated on ${date}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
      
      // Save the PDF
      const fileName = `KBL_Assessment_${enterpriseName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF exported successfully!', { id: tid, duration: 3000 });
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF. Please try again.', { id: tid, duration: 4000 });
    } finally {
      setExporting(false);
    }
  };

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

  // Get low-scoring categories for summary
  const lowScoringCategories = Object.entries(sections)
    .filter(([_, v]: any) => Number(v?.percentage || 0) < 50)
    .sort((a: any, b: any) => Number(a[1]?.percentage || 0) - Number(b[1]?.percentage || 0));

  if (loading) {
    return <div className={styles['report-page']}><div className={styles['report-card']}>Loading...</div></div>;
  }

  return (
    <div className={styles['report-page']} ref={reportRef}>
      <header className={styles['report-header']}>
        <div className={styles['report-title-section']}>
          <h1>ASSESSMENT REPORT</h1>
          <p>{enterpriseName}</p>
        </div>
        <button 
          onClick={handleExportPDF}
          disabled={exporting}
          className={`${styles['nav-button-secondary']} ${styles['nav-button']}`}
          style={{ opacity: exporting ? 0.7 : 1, cursor: exporting ? 'wait' : 'pointer' }}
        >
          <Download size={16} /> {exporting ? 'Exporting...' : 'Export as PDF'}
        </button>
      </header>
      
      <div className={styles['report-grid']}>
        <div className={styles['report-card']}>
          <h2 className={styles['section-header']}>Overall Health Score</h2>
          <p className={styles['health-score-value']} style={{ 
            color: overall > 70 ? '#10b981' : overall > 50 ? '#f59e0b' : '#ef4444' 
          }}>
            {Math.round(overall)}%
          </p>
          <p className={styles['health-score-text']}>
            {overall > 70 ? 'Your business is performing well!' : 
             overall > 50 ? 'There is room for improvement in some areas.' : 
             'Several areas need immediate attention.'}
          </p>
        </div>
        <div className={styles['report-card']}>
          <h2 className={styles['section-header']}>Performance Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Categories Assessed</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>{Object.keys(sections).length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Strong Areas (&gt;70%)</span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>
                {Object.values(sections).filter((v: any) => Number(v?.percentage || 0) > 70).length}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Needs Attention (&lt;50%)</span>
              <span style={{ fontWeight: 600, color: '#ef4444' }}>{lowScoringCategories.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Critical Areas Alert */}
      {lowScoringCategories.length > 0 && (
        <div className={`${styles['report-card']} ${styles['grid-col-span-2']}`} style={{ 
          backgroundColor: '#fef2f2', 
          borderColor: '#fecaca' 
        }}>
          <h2 className={styles['section-header']} style={{ color: '#991b1b' }}>
            <AlertTriangle size={20} /> CRITICAL AREAS REQUIRING ATTENTION
          </h2>
          <p style={{ color: '#7f1d1d', marginBottom: '1rem', fontSize: '0.875rem' }}>
            The following {lowScoringCategories.length} area{lowScoringCategories.length > 1 ? 's' : ''} scored below 50% and need immediate focus:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {lowScoringCategories.map(([name, v]: any) => (
              <span key={name} style={{ 
                backgroundColor: '#fee2e2', 
                color: '#991b1b', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                {name}: {Math.round(Number(v?.percentage || 0))}%
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Priority Focus Areas */}
      {focus.length > 0 && (
        <div className={`${styles['report-card']} ${styles['grid-col-span-2']}`}>
          <h2 className={styles['section-header']}><AlertTriangle size={20} /> PRIORITY QUESTIONS</h2>
          <div>
            {focus.map((f) => (
              <div key={f.code} className={styles['focus-item']}>
                <p className={styles['focus-item-title']}>
                  Question {f.code} 
                  <span className={`${styles['priority-tag']} ${styles['priority-new']}`}>Priority {f.priority}</span>
                </p>
                <button 
                  onClick={() => handleAddToActionPlan(`Question ${f.code}`)} 
                  className={`${styles['nav-button-primary']} ${styles['nav-button']}`}
                >
                  Add to Action Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Category Deep Dive */}
      <div className={`${styles['report-card']} ${styles['grid-col-span-2']}`}>
        <h2 className={styles['section-header']}>DETAILED CATEGORY ANALYSIS</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Click on each category to see detailed scores and improvement recommendations.
        </p>
        {Object.entries(sections)
          .sort((a: any, b: any) => Number(a[1]?.percentage || 0) - Number(b[1]?.percentage || 0))
          .map(([name, v]: any) => (
            <CategoryItem 
              key={name} 
              title={name} 
              score={Number(v?.percentage || 0)}
              weighted={Number(v?.weighted || 0)}
              perfect={Number(v?.perfect || 0)}
              showAdvice={true}
            />
          ))}
      </div>
      
      {/* Action Summary */}
      <div className={`${styles['report-card']} ${styles['grid-col-span-2']}`} style={{ 
        backgroundColor: '#f0fdf4', 
        borderColor: '#86efac' 
      }}>
        <h2 className={styles['section-header']} style={{ color: '#166534' }}>
          <TrendingUp size={20} /> NEXT STEPS
        </h2>
        <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#166534', fontSize: '0.9rem', lineHeight: 1.8 }}>
          <li>Review the critical areas highlighted above and prioritize them for improvement</li>
          <li>Add priority items to your Action Plan for systematic follow-up</li>
          <li>Implement the recommendations provided for each low-scoring category</li>
          <li>Schedule a follow-up assessment in 3-6 months to track progress</li>
          <li>Consider seeking expert assistance for areas with consistently low scores</li>
        </ol>
      </div>
    </div>
  );
};

// Component shown when user has no enterprise profile
const NoEnterprisePrompt = () => {
  const router = useRouter();
  return (
    <div className={styles['assessment-container']}>
      <div className={styles['wizard-page']}>
        <header className={styles['page-header']}>
          <h1 className={styles['page-title']}>CREATE ENTERPRISE FIRST</h1>
        </header>
        <div className={styles['questions-card']} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <AlertTriangle size={64} style={{ color: '#f59e0b', marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
            Enterprise Profile Required
          </h2>
          <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Before you can start an assessment, you need to create your enterprise profile. 
            This helps us tailor the diagnostic questions to your business.
          </p>
          <button 
            onClick={() => router.push('/settings?tab=enterprise')}
            className={`${styles['nav-button']} ${styles['nav-button-primary']}`}
            style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}
          >
            Create Enterprise Profile
          </button>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '1rem' }}>
            Already have a profile? <button onClick={() => router.push('/dashboard')} style={{ color: '#01497f', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Go to Dashboard</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default function AssessmentPageController() {
  const params = useParams();
  const router = useRouter();
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null);
  const [view, setView] = useState<'assessment' | 'report' | 'no-enterprise'>('assessment');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const resolve = async () => {
      const pid = params?.id as string | undefined;
      let eid: number | null = null;
      
      const access = getAccessToken();
      if (!access) {
        router.push('/login');
        return;
      }
      
      if (pid && !isNaN(Number(pid))) {
        eid = Number(pid);
      } else {
        // Try to get the user's enterprise profile
        try {
          const prof = await enterpriseApi.getProfile(access);
          // Check if enterprise actually exists (backend returns {exists: false} for no enterprise)
          if (prof?.id && prof?.exists !== false) {
            eid = Number(prof.id);
          } else {
            // No enterprise exists - show prompt
            setView('no-enterprise');
            setIsLoading(false);
            return;
          }
        } catch (e: any) {
          // 404 or error means no enterprise
          console.log('No enterprise found:', e?.message);
          setView('no-enterprise');
          setIsLoading(false);
          return;
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
            await enterpriseApi.getReport(access, eid);
            setView('report');
          } catch {
            setView('assessment');
          }
        }
      } else {
        // No enterprise ID - shouldn't happen but handle it
        setView('no-enterprise');
      }
      setIsLoading(false);
    };
    resolve();
  }, [params, router]);

  const handleStartOver = () => { setView('assessment'); };
  
  // Show loading state
  if (isLoading) {
    return <div className={styles['assessment-container']}>Loading...</div>;
  }
  
  // Show no-enterprise prompt
  if (view === 'no-enterprise') {
    return <NoEnterprisePrompt />;
  }
  
  // Show loading if we still don't have enterprise ID (shouldn't happen)
  if (!enterpriseId) {
    return <NoEnterprisePrompt />;
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