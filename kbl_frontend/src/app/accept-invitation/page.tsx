'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { teamApi } from '../../lib/api';
import { CheckCircle, AlertCircle, Building2, User, Lock, Mail } from 'lucide-react';
import styles from './accept-invitation.module.css';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<{
    enterprise_name: string;
    invited_by: string;
    email: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No invitation token provided');
        setLoading(false);
        return;
      }
      
      try {
        const data = await teamApi.getInvitation(token);
        setInviteData({
          enterprise_name: data.enterprise_name,
          invited_by: data.invited_by,
          email: data.email
        });
      } catch (e: any) {
        setError(e?.message || 'Invalid or expired invitation');
      } finally {
        setLoading(false);
      }
    };
    
    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setSubmitting(true);
    const tid = toast.loading('Creating your account...');
    
    try {
      const response = await teamApi.acceptInvite({
        token,
        password,
        confirm_password: confirmPassword,
        full_name: fullName
      });
      
      // Store tokens for auto-login
      if (response.access && response.refresh) {
        localStorage.setItem('accessToken', response.access);
        localStorage.setItem('refreshToken', response.refresh);
      }
      
      toast.success('Welcome! Your account has been created.', { id: tid });
      
      // Redirect to team portal
      setTimeout(() => {
        router.push('/team-portal');
      }, 1500);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to accept invitation', { id: tid });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Validating invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.errorState}>
            <AlertCircle size={64} className={styles.errorIcon} />
            <h1>Invalid Invitation</h1>
            <p>{error}</p>
            <button onClick={() => router.push('/login')} className={styles.primaryButton}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoSection}>
            <Building2 size={48} className={styles.logoIcon} />
            <h1>Join {inviteData?.enterprise_name}</h1>
          </div>
          <p className={styles.inviteText}>
            <strong>{inviteData?.invited_by}</strong> has invited you to join their team
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.emailDisplay}>
            <Mail size={18} />
            <span>{inviteData?.email}</span>
            <CheckCircle size={16} className={styles.verifiedIcon} />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="fullName">
              <User size={16} />
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={submitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">
              <Lock size={16} />
              Create Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              disabled={submitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">
              <Lock size={16} />
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              minLength={8}
              disabled={submitting}
            />
          </div>

          <button 
            type="submit" 
            className={styles.primaryButton}
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : 'Accept Invitation & Join'}
          </button>

          <p className={styles.termsText}>
            By accepting, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}

