'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import styles from './login.module.css';
import { apiLogin, apiAuthStatus } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      router.push('/dashboard');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password.', { duration: 4000 });
      return;
    }

    const id = 'login-toast';
    toast.dismiss(id);
    toast.loading('Logging in...', { id });
    try {
      const { access, refresh } = await apiLogin(email, password);
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      const status = await apiAuthStatus(access);
      toast.success('Login successful! Redirecting...', { id, duration: 2000 });
      if (status?.verified) {
        router.push('/dashboard');
      } else {
        router.push('/verify');
      }
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      // If backend indicates email not verified, route to verify page without noisy error toast
      if (msg.includes('verify your email')) {
        toast.dismiss(id);
        router.push('/verify');
        return;
      }
      toast.error(err?.message || 'Invalid email or password.', { id, duration: 3000 });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link href="/"><Image src="/kbl-logo-blue.png" alt="KBL Logo" width={80} height={40} priority /></Link>
        </div>
        
        <h1 className={styles.title}>Welcome Back</h1>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.eyeButton}>
                  {showPassword ? <EyeOff height={20} width={20} /> : <Eye height={20} width={20} />}
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