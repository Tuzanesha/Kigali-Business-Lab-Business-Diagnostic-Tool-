'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; 
import { Eye, EyeOff } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

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
        
        <h1 className={styles.title}>Welcome Back</h1>

        <div className={styles.card}>
          <form className={styles.form}>
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
                Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
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
              Log In
            </button>
            <Link href="/forgot-password" className={styles.forgotLink}>
              Forgot Password?
            </Link>
          </form>
        </div>

        <p className={styles.signupPrompt}>
          Don&apos;t have an account?{' '}
          <Link href="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}