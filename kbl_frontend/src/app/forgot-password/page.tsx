'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MailCheck } from 'lucide-react';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you would make an API call here.
    // We'll just simulate the success state.
    setSubmitted(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link href="/">
      <Image
        src="/kbl-logo-blue.png" 
        alt="KBL Logo"
        width={80} 
        height={40} 
        priority
      />
    </Link>
        </div>
        
        <h1 className={styles.title}>Reset Your Password</h1>

        <div className={styles.card}>
          {!submitted ? (
            <div className={styles.cardContent}>
              <p className={styles.introText}>
                Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
              </p>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    className={styles.input}
                    required
                  />
                </div>
                <button type="submit" className={styles.button}>
                  Send Reset Link
                </button>
              </form>
            </div>
          ) : (
            <div className={styles.confirmation}>
              <MailCheck className={styles.confirmationIcon} size={64} />
              <h2 className={styles.confirmationTitle}>Check Your Email</h2>
              <p className={styles.confirmationText}>
                If an account with that email exists, we have sent a password reset link to it.
              </p>
            </div>
          )}
        </div>

        <p className={styles.loginPrompt}>
          Remember your password?{' '}
          <Link href="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}