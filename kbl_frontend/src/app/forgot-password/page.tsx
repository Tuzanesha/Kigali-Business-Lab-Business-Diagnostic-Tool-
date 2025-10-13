'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      toast.error('Please enter an email address.');
      return;
    }

    const sendLinkPromise = new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 1500);
    });

    toast.promise(sendLinkPromise, {
      loading: 'Sending reset link...',
      success: 'If an account exists, a reset link has been sent.',
      error: 'Could not send reset link.',
    });

    sendLinkPromise.then(() => {
      setSubmitted(true);
    });
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

        <h1 className={styles.title}>{submitted ? 'Email Sent' : 'Reset Your Password'}</h1>

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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                Please check your inbox (and spam folder) for a message from us containing the reset link.
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