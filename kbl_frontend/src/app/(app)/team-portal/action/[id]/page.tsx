'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  User,
  Building2,
  MessageSquare,
  FileText,
  Upload,
  Send,
  Download,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { actionItemApi, getAccessToken } from '../../../../../lib/api';
import styles from './action-detail.module.css';

interface Note {
  id: number;
  content: string;
  progress_update: number | null;
  author: { id: number; email: string; name: string };
  created_at: string;
}

interface Document {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  description: string;
  file_url: string;
  uploaded_by: { id: number; name: string };
  created_at: string;
}

interface ActionDetail {
  id: number;
  title: string;
  description: string;
  source: string;
  priority: string;
  status: string;
  due_date: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  owner: { id: number; email: string; name: string };
  enterprise: { id: number | null; name: string | null };
  assigned_to: { id: number | null; email: string | null; name: string | null } | null;
  completed_by: { id: number | null; name: string | null } | null;
  notes: Note[];
  documents: Document[];
}

export default function ActionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const actionId = Number(params.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<ActionDetail | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newProgress, setNewProgress] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadAction = async () => {
    const access = getAccessToken();
    if (!access) {
      router.push('/login');
      return;
    }

    try {
      const data = await actionItemApi.getDetail(access, actionId);
      setAction(data);
      setNewProgress(data.progress_percentage);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load action item');
      if (e?.status === 404) {
        router.push('/team-portal');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAction();
  }, [actionId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    const access = getAccessToken();
    if (!access) return;

    setSubmitting(true);
    try {
      await actionItemApi.addNote(
        access, 
        actionId, 
        newNote.trim(), 
        typeof newProgress === 'number' ? newProgress : undefined
      );
      toast.success('Note added successfully');
      setNewNote('');
      loadAction();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (status?: string) => {
    const access = getAccessToken();
    if (!access) return;

    setSubmitting(true);
    const tid = toast.loading('Updating...');
    try {
      await actionItemApi.updateProgress(access, actionId, {
        progress_percentage: typeof newProgress === 'number' ? newProgress : undefined,
        status
      });
      toast.success('Progress updated', { id: tid });
      loadAction();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update', { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = () => {
    handleUpdateProgress('completed');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const access = getAccessToken();
    if (!access) return;

    setUploading(true);
    const tid = toast.loading('Uploading file...');
    try {
      await actionItemApi.uploadDocument(access, actionId, file);
      toast.success('File uploaded successfully', { id: tid });
      loadAction();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      toast.error(e?.message || 'Failed to upload file', { id: tid });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#64748b';
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading action item...</p>
      </div>
    );
  }

  if (!action) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={48} />
        <p>Action item not found</p>
        <Link href="/team-portal" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Portal
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/team-portal" className={styles.backLink}>
          <ArrowLeft size={20} /> Back to Portal
        </Link>
      </header>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Left Column - Action Details */}
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <div className={styles.actionHeader}>
              <div className={styles.statusBadge} data-status={action.status}>
                {action.status === 'completed' ? <CheckCircle2 size={16} /> : 
                 action.status === 'inprogress' ? <Clock size={16} /> : 
                 <AlertCircle size={16} />}
                {action.status === 'completed' ? 'Completed' : 
                 action.status === 'inprogress' ? 'In Progress' : 'To Do'}
              </div>
              <span 
                className={styles.priorityBadge}
                style={{ backgroundColor: getPriorityColor(action.priority) }}
              >
                {action.priority} Priority
              </span>
            </div>

            <h1 className={styles.actionTitle}>{action.title}</h1>
            
            {action.description && (
              <p className={styles.actionDescription}>{action.description}</p>
            )}

            {/* Meta Info */}
            <div className={styles.metaGrid}>
              {action.enterprise?.name && (
                <div className={styles.metaItem}>
                  <Building2 size={16} />
                  <span>{action.enterprise.name}</span>
                </div>
              )}
              {action.due_date && (
                <div className={styles.metaItem}>
                  <Calendar size={16} />
                  <span>Due: {new Date(action.due_date).toLocaleDateString()}</span>
                </div>
              )}
              {action.assigned_to?.name && (
                <div className={styles.metaItem}>
                  <User size={16} />
                  <span>Assigned to: {action.assigned_to.name}</span>
                </div>
              )}
              {action.source && (
                <div className={styles.metaItem}>
                  <FileText size={16} />
                  <span>Source: {action.source}</span>
                </div>
              )}
            </div>

            {/* Progress Section */}
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <h3><TrendingUp size={18} /> Progress</h3>
                <span className={styles.progressValue}>{action.progress_percentage}%</span>
              </div>
              <div className={styles.progressBarLarge}>
                <div 
                  className={styles.progressFillLarge}
                  style={{ width: `${action.progress_percentage}%` }}
                />
              </div>
              
              <div className={styles.progressControls}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={typeof newProgress === 'number' ? newProgress : action.progress_percentage}
                  onChange={(e) => setNewProgress(Number(e.target.value))}
                  className={styles.progressSlider}
                  disabled={action.status === 'completed'}
                />
                <div className={styles.progressButtons}>
                  <button 
                    onClick={() => handleUpdateProgress()}
                    disabled={submitting || action.status === 'completed'}
                    className={styles.secondaryButton}
                  >
                    Update Progress
                  </button>
                  {action.status !== 'completed' && (
                    <button 
                      onClick={handleMarkComplete}
                      disabled={submitting}
                      className={styles.successButton}
                    >
                      <CheckCircle2 size={16} /> Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>

            {action.completed_at && (
              <div className={styles.completedBanner}>
                <CheckCircle2 size={20} />
                <span>
                  Completed on {new Date(action.completed_at).toLocaleDateString()}
                  {action.completed_by?.name && ` by ${action.completed_by.name}`}
                </span>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <MessageSquare size={20} /> Notes & Updates
            </h2>

            {/* Add Note Form */}
            <div className={styles.addNoteForm}>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note or update..."
                className={styles.noteTextarea}
                disabled={submitting}
              />
              <div className={styles.noteFormFooter}>
                <button
                  onClick={handleAddNote}
                  disabled={submitting || !newNote.trim()}
                  className={styles.primaryButton}
                >
                  <Send size={16} /> Add Note
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className={styles.notesList}>
              {action.notes.length === 0 ? (
                <p className={styles.emptyText}>No notes yet. Be the first to add an update!</p>
              ) : (
                action.notes.map((note) => (
                  <div key={note.id} className={styles.noteItem}>
                    <div className={styles.noteHeader}>
                      <span className={styles.noteAuthor}>{note.author.name}</span>
                      <span className={styles.noteDate}>
                        {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className={styles.noteContent}>{note.content}</p>
                    {note.progress_update !== null && (
                      <div className={styles.noteProgress}>
                        <TrendingUp size={12} />
                        Progress updated to {note.progress_update}%
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Documents */}
        <div className={styles.sideColumn}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              <FileText size={20} /> Documents
            </h2>

            {/* Upload Button */}
            <div className={styles.uploadSection}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className={styles.fileInput}
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={styles.uploadButton}
              >
                <Upload size={18} />
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
              <p className={styles.uploadHint}>Max file size: 10MB</p>
            </div>

            {/* Documents List */}
            <div className={styles.documentsList}>
              {action.documents.length === 0 ? (
                <p className={styles.emptyText}>No documents uploaded yet.</p>
              ) : (
                action.documents.map((doc) => (
                  <div key={doc.id} className={styles.documentItem}>
                    <div className={styles.documentIcon}>
                      <FileText size={24} />
                    </div>
                    <div className={styles.documentInfo}>
                      <p className={styles.documentName}>{doc.filename}</p>
                      <p className={styles.documentMeta}>
                        {formatFileSize(doc.file_size)} • {doc.uploaded_by.name}
                      </p>
                    </div>
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.downloadButton}
                    >
                      <Download size={16} />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

