'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import styles from './reset-password.module.css';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      
      toast.error("Passwords do not match!");
      return;
    }
    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }


    const updatePasswordPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
      
        if (true) {
          resolve('Success!');
        } else {
          reject('API Error');
        }
      }, 1500);
    });


    toast.promise(
      updatePasswordPromise,
      {
        loading: 'Updating password...',         
        success: 'Password has been updated!', 
        error: 'Could not update password.',   
      }
    );
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