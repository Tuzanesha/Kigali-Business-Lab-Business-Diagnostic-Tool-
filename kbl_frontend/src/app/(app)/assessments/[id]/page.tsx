
'use client';

import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useParams, useRouter } from 'next/navigation';
import styles from './assessment.module.css';
import { Check, UploadCloud, File as FileIcon, X, AlertTriangle, ChevronDown, Download, Lightbulb, TrendingUp } from 'lucide-react';
import { catalogApi, enterpriseApi, getAccessToken } from '../../../../lib/api';

// ... (KEEP YOUR CATEGORY_ADVICE and getAdviceForCategory functions HERE - Same as before) ...
const CATEGORY_ADVICE: Record<string, { tips: string[]; resources: string[] }> = {
  'LEADERSHIP': {
    tips: [
      'Develop a clear vision and mission statement',
      'Implement regular team meetings',
      'Create leadership development programs',
      'Establish clear decision-making processes',
      'Set measurable goals and track progress'
    ],
    resources: ['Leadership workshops', 'Executive coaching']
  },
  // ... Add the rest of your advice object here just like you had it ...
};

const getAdviceForCategory = (categoryName: string): { tips: string[]; resources: string[] } => {
  // Simplified for brevity in this snippet, use your full function
  return { tips: ['Review current processes', 'Seek feedback'], resources: ['Workshops'] };
};

interface AssessmentReportProps {
  enterpriseId: number;
  onRetake: () => void;
}

type UiQuestion = { id: string; text: string; options: string[]; backendId: number };

const FileUpload = ({ file, onFileChange, onFileRemove }: { file: File | null, onFileChange: (file: File) => void, onFileRemove: () => void }) => { 
  const [isDragging, setIsDragging] = useState(false); 
  const uniqueId = React.useId(); 
  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }; 
  const handleDragIn = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items?.length > 0) setIsDragging(true); }; 
  const handleDragOut = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }; 
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.length > 0) { onFileChange(e.dataTransfer.files[0]); e.dataTransfer.clearData(); } }; 
  
  if (file) { 
    return <div className={styles['file-preview']}><div className={styles['file-info']}><div style={{background:'#e0f2fe', padding:'8px', borderRadius:'8px', color:'#0284c7'}}><FileIcon size={24} /></div><div><p className={styles['file-name']}>{file.name}</p><p className={styles['file-size']}>{(file.size / 1024).toFixed(1)} KB</p></div></div><button onClick={onFileRemove} className={styles['remove-file-button']}><X size={18} /></button></div>; 
  } 
  
  return <div onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop} className={`${styles['upload-zone']} ${isDragging ? styles.active : ''}`}><input type="file" id={uniqueId} hidden onChange={(e) => e.target.files && onFileChange(e.target.files[0])} /><label htmlFor={uniqueId} style={{ cursor: 'pointer' }}><UploadCloud className={styles['upload-icon']} size={48} /><p className={styles['upload-text-main']}>Click to upload evidence</p><p className={styles['upload-text-sub']}>or drag and drop PDF, DOCX</p></label></div>; 
};

// --- UPDATED QUESTION COMPONENT WITH CARDS ---
const Question = ({ question, answer, onAnswerChange }: { question: {id: string, text: string, options: string[]}, answer: number, onAnswerChange: (id: string, value: number) => void }) => { 
  const [showGuidance, setShowGuidance] = useState(false); 
  
  return ( 
    <div className={styles.question} id={`q-${question.id}`}>
      <div className={styles['question-header']}>
        <div className={styles['question-number']}>Q</div>
        <div style={{width: '100%'}}>
          <p className={styles['question-text']}>{question.text}</p>
          <p className={styles['question-subtext']}>Select the best description for your business</p>
          
          {/* THE NEW CARD GRID */}
          <div className={styles['options-grid']}>
            {question.options.map((opt, i) => (
              <div 
                key={i} 
                className={`${styles['option-card']} ${answer === i ? styles.selected : ''}`}
                onClick={() => onAnswerChange(question.id, i)}
              >
                {answer === i && <Check size={16} className={styles['check-icon']} />}
                <span className={styles['option-number']}>0{i}</span>
                <span className={styles['option-text']}>{opt}</span>
                <input 
                  type="radio" 
                  name={question.id} 
                  value={i} 
                  checked={answer === i} 
                  readOnly 
                  className={styles['radio-input']} 
                />
              </div>
            ))}
          </div>

          <button onClick={() => setShowGuidance(!showGuidance)} className={styles['guidance-toggle']}>
            <Lightbulb size={16} />
            {showGuidance ? 'Hide Notes' : 'Add Notes & View Guidance'}
          </button>
          
          {showGuidance && <textarea className={styles['comment-textarea']} placeholder="Add your comments, observations, or action items here..."></textarea>}
        </div>
      </div>
    </div> 
  ); 
};

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
        
        const allQuestionsResponse = await catalogApi.getAllQuestions(access);
        
        if (allQuestionsResponse.total_questions === 0) {
          toast.error('No questions found.', { id });
          setLoading(false);
          return;
        }
        
        const categoryNames = allQuestionsResponse.categories || [];
        setSteps(categoryNames);
        
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
        toast.error(e?.message || 'Failed to load', { id });
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleNext = () => {
    const unanswered = questions.filter(q => answers[q.id] === undefined || answers[q.id] === null);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions in this section.`);
      const el = document.getElementById(`q-${unanswered[0].id}`);
      if(el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      window.scrollTo(0,0);
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      const submit = async () => {
        const access = getAccessToken();
        if (!access) throw new Error('Unauthorized');
        const payload: Array<{question_id: number; score: number}> = [];
        for (const stepName of steps) {
          for (const q of (questionsByStep[stepName] || [])) {
            const score = answers[q.id];
            if (typeof score === 'number') payload.push({ question_id: q.backendId, score });
          }
        }
        await enterpriseApi.submitAnswers(access, enterpriseId, payload);
        await enterpriseApi.recompute(access, enterpriseId);
        try { await enterpriseApi.getReport(access, enterpriseId); } catch {}
      };
      toast.promise(submit(), {
        loading: 'Finalizing...',
        success: 'Done!',
        error: 'Failed.'
      }).then(() => onComplete());
    }
  };

  const handlePrev = () => { 
    if (currentStepIndex > 0) { 
      setCurrentStepIndex(currentStepIndex - 1); 
      window.scrollTo(0,0);
    } 
  };
  
  const handleFileChange = (file: File) => { setFiles(prevFiles => ({ ...prevFiles, [currentStepName]: file })); };
  const handleFileRemove = () => { setFiles(prevFiles => ({ ...prevFiles, [currentStepName]: null })); };

  if (loading) return <div className={styles['wizard-page']} style={{textAlign:'center', marginTop:'5rem'}}>Loading assessment...</div>;

  return ( 
    <div className={styles['assessment-container']}>
      <div className={styles['wizard-page']}>
        <header className={styles['page-header']}>
          <h1 className={styles['page-title']}>DIAGNOSTIC ASSESSMENT</h1>
          <p style={{color:'#64748b'}}>Evaluate your business health across key dimensions</p>
        </header>
        
        {/* IMPROVED STEPPER */}
        <div className={styles['stepper-card']}>
          <div className={styles['stepper-header']}>
            <p className={styles['stepper-title']}>YOUR PROGRESS</p>
            <p className={styles['stepper-progress']}>Step {currentStepIndex + 1} of {steps.length}</p>
          </div>
          <div className={styles['stepper-track']}>
            {steps.map((step, index) => (
              <div key={step} className={`${styles.step} ${index === currentStepIndex ? styles.active : ''} ${index < currentStepIndex ? styles.completed : ''}`}>
                <div className={styles['step-circle']}>
                  {index < currentStepIndex ? <Check size={16} /> : index + 1}
                </div>
                <p className={styles['step-label']}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles['questions-card']}>
          <div className={styles['questions-header']}>
            <div className={styles['section-indicator']}></div>
            <div>
              <h2 className={styles['questions-title']}>{currentStepName}</h2>
              <p className={styles['questions-counter']}>{questions.length} Questions</p>
            </div>
          </div>
          
          {questions.map((q) => (
            <Question 
              key={q.id} 
              question={q} 
              answer={answers[q.id]} 
              onAnswerChange={(id, value) => setAnswers({ ...answers, [id]: value })} 
            />
          ))}
          
          <div className={styles['upload-zone-container']}>
            <h4 style={{fontWeight:'600', marginBottom:'0.5rem', color:'#334155'}}>Supporting Evidence (Optional)</h4>
            <FileUpload file={files[currentStepName] || null} onFileChange={handleFileChange} onFileRemove={handleFileRemove} />
          </div>
        </div>

        <div className={styles['wizard-nav']}>
          <button onClick={handlePrev} disabled={currentStepIndex === 0} className={`${styles['nav-button']} ${styles['nav-button-secondary']}`}>
            Back
          </button>
          <div style={{display:'flex', gap:'1rem'}}>
            <button onClick={onExit} className={`${styles['nav-button']} ${styles['nav-button-secondary']}`} style={{border:'none', background:'none'}}>
              Save & Exit
            </button>
            <button onClick={handleNext} className={`${styles['nav-button']} ${styles['nav-button-primary']}`}>
              {currentStepIndex === steps.length - 1 ? 'Finish Assessment' : 'Next Section'}
            </button>
          </div>
        </div>
      </div> 
    </div>
  );
};

// ... (KEEP AssessmentReport, CategoryItem, NoEnterprisePrompt, and AssessmentPageController as they were in your code) ...
// Ensure AssessmentPageController wraps AssessmentWizard with the same props.

// [I've condensed the rest for brevity since you have it, but the key change was the Question component above]
// Be sure to include the Report component code you had before here.

const CategoryItem = ({ title, score, weighted, perfect, showAdvice = true }: any) => { 
  const [isOpen, setIsOpen] = useState(score < 50); 
  const scoreColor = score > 70 ? '#10b981' : score > 50 ? '#f59e0b' : '#ef4444';
  
  return ( 
    <div className={styles['category-item']}>
      <div className={styles['category-header']} onClick={() => setIsOpen(!isOpen)}>
        <div style={{ flex: 1, paddingRight: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <p className={styles['category-title']}>{title}</p>
          </div>
          <div className={styles['progress-bar-bg']}>
            <div className={styles['progress-bar-fg']} style={{ width: `${score}%`, backgroundColor: scoreColor }}></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={styles['category-score']} style={{color: scoreColor, fontSize:'1.5rem'}}>{Math.round(score)}%</span>
          <ChevronDown size={20} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>
      </div>
      {isOpen && (
        <div className={styles['category-details']}>
          <div className={styles['detail-item']} style={{ marginBottom: '1rem' }}>
            <p className={styles['detail-question']}>Weighted: {weighted} / {perfect}</p>
          </div>
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
      
      const reportElement = reportRef.current;
      
      // Generate canvas with high quality
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1200, // Fixed width for consistent rendering
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const headerHeight = 25;
      const footerHeight = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const contentHeight = pdfHeight - headerHeight - footerHeight;
      
      // Calculate image dimensions to fit full page width
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const imgRatio = imgWidth / imgHeight;
      const scaledWidth = contentWidth;
      const scaledHeight = scaledWidth / imgRatio;
      
      // Calculate total pages needed
      const totalPages = Math.ceil(scaledHeight / contentHeight);
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Helper to add header to each page
      const addHeader = (pageNum: number) => {
        // Header background
        pdf.setFillColor(1, 73, 127);
        pdf.rect(0, 0, pdfWidth, 20, 'F');
        
        // Header text
        pdf.setFontSize(14);
        pdf.setTextColor(255, 255, 255);
        pdf.text('KIGALI BUSINESS LAB', margin, 8);
        pdf.setFontSize(10);
        pdf.text('Business Diagnostic Assessment Report', margin, 14);
        
        // Enterprise name on the right
        pdf.setFontSize(10);
        pdf.text(enterpriseName, pdfWidth - margin, 8, { align: 'right' });
        pdf.text(date, pdfWidth - margin, 14, { align: 'right' });
        
        // Page number
        if (totalPages > 1) {
          pdf.setFontSize(8);
          pdf.setTextColor(255, 255, 255);
          pdf.text(`Page ${pageNum} of ${totalPages}`, pdfWidth / 2, 14, { align: 'center' });
        }
      };
      
      // Helper to add footer to each page
      const addFooter = () => {
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text('© Kigali Business Lab - Confidential', pdfWidth / 2, pdfHeight - 5, { align: 'center' });
      };
      
      // Generate pages
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        addHeader(page + 1);
        
        // Calculate source rectangle for this page
        const sourceY = page * (contentHeight / scaledWidth * imgWidth);
        const sourceHeight = Math.min(contentHeight / scaledWidth * imgWidth, imgHeight - sourceY);
        
        if (sourceHeight > 0) {
          // Create a temporary canvas for this page section
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = sourceHeight;
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
            const pageImgData = pageCanvas.toDataURL('image/png');
            const pageImgHeight = sourceHeight / imgWidth * contentWidth;
            pdf.addImage(pageImgData, 'PNG', margin, headerHeight, contentWidth, pageImgHeight);
          }
        }
        
        addFooter();
      }
      
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


// This must be the default export
export default function AssessmentPageController() {
  const params = useParams();
  const router = useRouter();
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null);
  const [view, setView] = useState<'assessment' | 'report' | 'no-enterprise'>('assessment');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const resolve = async () => {
      const pid = params?.id as string | undefined;
      const access = getAccessToken();
      if (!access) { router.push('/login'); return; }
      
      try {
        const prof = await enterpriseApi.getProfile(access);
        if (prof?.id) {
            setEnterpriseId(Number(prof.id));
            if (pid && !isNaN(Number(pid))) {
                 try { await enterpriseApi.getReport(access, Number(prof.id)); setView('report'); } catch { setView('assessment'); }
            }
        } else {
            setView('no-enterprise');
        }
      } catch (e) { setView('no-enterprise'); }
      setIsLoading(false);
    };
    resolve();
  }, [params, router]);

  if (isLoading) return <div>Loading...</div>;
  if (view === 'no-enterprise') return <div className={styles['wizard-page']}>Please create an enterprise first.</div>;
  
  return (
    <div className={styles['assessment-container']}>
      {view === 'assessment' ? (
        <AssessmentWizard enterpriseId={enterpriseId!} onComplete={() => setView('report')} onExit={() => setView('assessment')} />
      ) : (
        <AssessmentReport enterpriseId={enterpriseId!} onRetake={() => setView('assessment')} />
      )}
    </div>
  );
}
