'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import styles from './reset-password.module.css';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

// Force dynamic rendering - prevents static generation
export const dynamic = 'force-dynamic';

function ResetPasswordForm() {
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const params = useSearchParams();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match!", { duration: 4000 });
      return;
    }
    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.", { duration: 4000 });
      return;
    }
    const uid = params.get('uid') || '';
    const token = params.get('token') || '';
    if (!uid || !token) {
      toast.error('Invalid or missing reset link.', { duration: 4000 });
      return;
    }
    const promise = (async () => {
      await authApi.passwordResetConfirm(uid, token, formData.newPassword);
      setTimeout(() => router.push('/login'), 1500);
    })();
    toast.promise(promise, {
      loading: 'Updating password...',
      success: 'Password has been updated! Redirecting...',
      error: 'Could not update password.',
    }, {
      duration: 3000,
      success: {
        duration: 3000,
      },
      error: {
        duration: 4000,
      },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link href="/"><Image src="/kbl-logo-blue.png" alt="KBL Logo" width={80} height={40} priority /></Link>
        </div>
        <h1 className={styles.title}>Reset Your Password</h1>
        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* ... (The form JSX remains exactly the same) ... */}
            <div className={styles.formGroup}>
              <label htmlFor="newPassword" className={styles.label}>New Password</label>
              <div className={styles.passwordWrapper}><input id="newPassword" name="newPassword" type={showNewPassword ? 'text' : 'password'} value={formData.newPassword} onChange={handleChange} className={styles.input} placeholder="Enter your new password" required /><button type="button" className={styles.eyeButton} onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
              <div className={styles.passwordWrapper}><input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} className={styles.input} placeholder="Confirm your new password" required /><button type="button" className={styles.eyeButton} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>
            </div>
            <button type="submit" className={styles.button}>Update Password</button>
          </form>
        </div>
        <p className={styles.signupPrompt}>Remembered your password?{' '}<Link href="/login">Back to Login</Link></p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Link href="/"><Image src="/kbl-logo-blue.png" alt="KBL Logo" width={80} height={40} priority /></Link>
          </div>
          <h1 className={styles.title}>Reset Your Password</h1>
          <div className={styles.card}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}