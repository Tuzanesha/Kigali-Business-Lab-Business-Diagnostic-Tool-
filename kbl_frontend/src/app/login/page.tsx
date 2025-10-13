'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; 
import toast from 'react-hot-toast';        
import { Eye, EyeOff } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 

    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }


    const loginPromise = new Promise((resolve, reject) => {
      setTimeout(() => {

        if (email === "user@example.com" && password === "password") {
          resolve('Login successful!');
        } else {
          reject('Invalid credentials');
        }
      }, 1500); 
    });


    await toast.promise(loginPromise, {
      loading: 'Logging in...',
      success: 'Login successful! Redirecting...',
      error: 'Invalid email or password.',
    });


    loginPromise.then(() => {
        setTimeout(() => {
            router.push('/dashboard'); 
        }, 500); 
    }).catch(() => {

        console.error("Login failed");
    });
  };

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