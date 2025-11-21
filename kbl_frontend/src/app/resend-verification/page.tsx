'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import styles from './resend-verification.module.css';
import { verificationApi } from '@/lib/api';

export default function ResendVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address.', { duration: 4000 });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address.', { duration: 4000 });
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Sending verification email...');

    try {
      await verificationApi.resendVerification(email);
      toast.success('Verification email sent! Please check your inbox.', {
        id: toastId,
        duration: 5000,
      });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to send verification email. Please try again.';
      toast.error(errorMessage, {
        id: toastId,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link href="/">
            <Image
              src="/kbl-logo-blue.png"
              alt="KBL Logo"
              width={100}
              height={40}
              priority
            />
          </Link>
        </div>

        <h1 className={styles.title}>Resend Verification Email</h1>

        <div className={styles.card}>
          <div className={styles.cardContent}>
            <p className={styles.message}>
              Enter your email address and we'll send you a new verification link.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} />
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your email address"
                    className={styles.input}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={styles.button}
                disabled={isLoading || !email}
              >
                {isLoading ? 'Sending...' : 'Send Verification Email'}
              </button>
            </form>

            <div className={styles.actions}>
              <Link href="/login" className={styles.link}>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



