'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './verification-status.module.css';

export const dynamic = 'force-dynamic';

function VerificationStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const verification = searchParams?.get('verification');
    const message = searchParams?.get('message');
    
    if (verification === 'success') {
      if (message === 'email_verified') {
        toast.success('Email verified successfully! You can now log in.', {
          duration: 5000,
        });
      } else if (message === 'already_verified') {
        toast.success('Your email is already verified. You can log in.', {
          duration: 5000,
        });
      }
    } else if (verification === 'error') {
      if (message === 'invalid_link') {
        toast.error('Invalid verification link. Please request a new one.', {
          duration: 6000,
        });
      } else if (message === 'expired_link') {
        toast.error('Verification link has expired. Please request a new one.', {
          duration: 6000,
        });
      }
    }
  }, [searchParams]);

  const verification = searchParams?.get('verification');
  const message = searchParams?.get('message');

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

        {verification === 'success' && (
          <>
            <h1 className={styles.title}>Email Verified!</h1>
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.successIcon}>✓</div>
                <p className={styles.message}>
                  {message === 'already_verified'
                    ? 'Your email is already verified. You can now log in to your account.'
                    : 'Your email has been successfully verified! You can now log in to your account.'}
                </p>
                <Link href="/login" className={styles.button}>
                  Go to Login
                </Link>
              </div>
            </div>
          </>
        )}

        {verification === 'error' && (
          <>
            <h1 className={styles.title}>Verification Failed</h1>
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.errorIcon}>✗</div>
                <p className={styles.message}>
                  {message === 'invalid_link'
                    ? 'The verification link is invalid. Please request a new verification email.'
                    : message === 'expired_link'
                    ? 'The verification link has expired. Please request a new verification email.'
                    : 'Something went wrong with the verification. Please try again.'}
                </p>
                <div className={styles.actions}>
                  <Link href="/login" className={styles.buttonSecondary}>
                    Back to Login
                  </Link>
                  <Link href="/resend-verification" className={styles.button}>
                    Request New Link
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {verification === 'pending' && (
          <>
            <h1 className={styles.title}>Check Your Email</h1>
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.pendingIcon}>📧</div>
                <p className={styles.message}>
                  We sent a verification link to your email. Please click the link to verify your account before logging in.
                </p>
                <div className={styles.actions}>
                  <Link href="/login" className={styles.buttonSecondary}>
                    Back to Login
                  </Link>
                  <Link href="/resend-verification" className={styles.button}>
                    Resend Email
                  </Link>
                </div>
                <p className={styles.note}>
                  Didn't receive an email? Check your spam folder or try again in a couple of minutes.
                </p>
              </div>
            </div>
          </>
        )}

        {!verification && (
          <>
            <h1 className={styles.title}>Verification Status</h1>
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <p className={styles.message}>
                  Please check your email for the verification link.
                </p>
                <Link href="/login" className={styles.button}>
                  Back to Login
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerificationStatusPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '2px solid #0179d2', 
              borderTop: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#6b7280' }}>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <VerificationStatusContent />
    </Suspense>
  );
}




