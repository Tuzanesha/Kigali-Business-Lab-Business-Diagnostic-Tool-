'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './verify.module.css';

export default function VerifyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link href="/">
            <Image src="/kbl-logo-blue.png" alt="KBL Logo" width={100} height={40} priority />
          </Link>
        </div>
        <h1 className={styles.title}>Check your email</h1>
        <div className={styles.card}>
          <div className={styles.cardContent}>
            <p className={styles.message}>
              We sent a verification link to your email. Please click the link to verify your account before logging in.
            </p>
            <div className={styles.actions}>
              <Link href="/login" className={styles.button}>Back to Login</Link>
            </div>
            <p className={styles.note}>
              Didnt receive an email? Check your spam folder or try again in a couple of minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
