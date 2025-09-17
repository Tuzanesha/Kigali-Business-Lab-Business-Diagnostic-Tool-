'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import styles from './signup.module.css';

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);

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
        
        <h1 className={styles.title}>Create Your Account</h1>

        <div className={styles.card}>
          <div className={styles.cardContent}>
            <form className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="fullName" className={styles.label}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  placeholder="Enter your full name"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Create Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    placeholder="Create a password"
                    className={styles.input}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeButton}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff height={20} width={20} />
                    ) : (
                      <Eye height={20} width={20} />
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.button}>
                Create Account
              </button>
            </form>
            <p className={styles.termsText}>
              By signing up, you agree to our{' '}
              <Link href="#">Terms of Service</Link> and{' '}
              <Link href="#">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        <p className={styles.loginPrompt}>
          Already have an account?{' '}
          <Link href="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}