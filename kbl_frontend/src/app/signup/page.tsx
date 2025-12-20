'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import styles from './signup.module.css';
import { authApi } from '@/lib/api';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !phone) {
      toast.error('Please fill in all fields.', { duration: 4000 });
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.', { duration: 4000 });
      return;
    }
    const id = toast.loading('Creating account...');
    try {
      await authApi.register(fullName, email, password, phone);
      toast.success('Verification link sent to your email.', { id, duration: 3000 });
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      toast.error(err?.message || 'Could not create account.', { id, duration: 4000 });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link href="/">
            <Image
              src="/kbl-logo-white.png"
              alt="KBL Logo"
              width={120}
              height={60}
              priority
            />
          </Link>
        </div>

        <h1 className={styles.title}>Create Your Account</h1>

        <div className={styles.card}>
          <div className={styles.cardContent}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="fullName" className={styles.label}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  placeholder="Enter your full name"
                  className={styles.input}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.label}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="Enter your phone number"
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
