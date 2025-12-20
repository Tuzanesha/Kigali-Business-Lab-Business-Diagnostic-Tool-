'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { authApi, checkAuth, teamApi, enterpriseApi } from '@/lib/api';
import styles from './login.module.css';

export const dynamic = 'force-dynamic';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check for verification status in URL params and authentication
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const { isAuthenticated, needsVerification } = await checkAuth();
        
        if (isAuthenticated) {
          if (needsVerification) {
            router.push('/verification-status?verification=pending');
          } else {
            // Check if user is team member and redirect accordingly
            const access = localStorage.getItem('accessToken');
            if (access) {
              try {
                const portalData = await teamApi.getPortal(access);
                const isTeamMember = portalData.is_team_member_only === true || 
                  (portalData.total_enterprises > 0 && portalData.is_owner === false);
                if (isTeamMember) {
                  router.push('/team-portal');
                  return;
                }
              } catch (portalError: any) {
                // If error, assume owner and go to dashboard
                if (portalError?.status === 403 && portalError?.data?.is_owner) {
                  router.push('/dashboard');
                  return;
                }
                // Try enterprise profile check
                try {
                  await enterpriseApi.getProfile(access);
                  router.push('/dashboard');
                  return;
                } catch {
                  // Default to dashboard
                }
              }
            }
            router.push('/dashboard');
          }
          return;
        }

        // Check URL parameters for verification results
        const verification = searchParams?.get('verification');
        const message = searchParams?.get('message');
        const error = searchParams?.get('error');

        if (verification === 'success') {
          if (message === 'email_verified') {
            toast.success('Email verified successfully! Please log in.', {
              duration: 5000,
              icon: '✅'
            });
          } else if (message === 'already_verified') {
            toast.success('Your email is already verified. Please log in.', {
              duration: 5000,
              icon: 'ℹ️'
            });
          }
        } else if (error === 'invalid_link') {
          toast.error('Invalid verification link. Please request a new one.', {
            duration: 6000,
            icon: '❌'
          });
        } else if (error === 'expired_link') {
          toast.error('Verification link has expired. Please request a new one.', {
            duration: 6000,
            icon: '⏰'
          });
        }

      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password.', { 
        duration: 4000,
        icon: '❌'
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address.', {
        duration: 4000,
        icon: '❌'
      });
      return;
    }

    setIsLoggingIn(true);
    const toastId = toast.loading('Signing you in...');

    try {
      const { access, refresh } = await authApi.login(email, password);
      
      // Store tokens
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Check verification status
      const status = await authApi.status(access);
      
      toast.success('Login successful! Redirecting...', { 
        id: toastId, 
        duration: 2000,
        icon: '✅'
      });

      if (status.verified) {
        // Check if user is a team member and redirect accordingly
        try {
          const portalData = await teamApi.getPortal(access);
          const isTeamMember = portalData.is_team_member_only === true || 
            (portalData.total_enterprises > 0 && portalData.is_owner === false);
          if (isTeamMember) {
            // Team member - redirect to team portal
            setTimeout(() => {
              router.push('/team-portal');
            }, 1000);
            return;
          }
        } catch (portalError: any) {
          // If 403 with is_owner flag, user is owner - continue to dashboard
          if (portalError?.status === 403 && portalError?.data?.is_owner) {
            // Owner - continue to dashboard
          } else if (portalError?.status === 403 && portalError?.data?.is_team_member_only === false) {
            // New user (not team member) - continue to dashboard
          } else {
            // Try to check enterprise profile to determine if owner
            try {
              await enterpriseApi.getProfile(access);
              // Can access enterprise profile - owner, continue to dashboard
            } catch {
              // Can't access - might be team member, redirect to team portal
              setTimeout(() => {
                router.push('/team-portal');
              }, 1000);
              return;
            }
          }
        }
        
        // Owner or new user - redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        // Redirect to verification status page if not verified
        setTimeout(() => {
          router.push('/verification-status?verification=pending');
        }, 1000);
      }

    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error cases
      const errorMessage = err?.message || '';
      
      if (errorMessage.includes('verify your email') || err?.needsVerification) {
        toast.error('Please verify your email before logging in. We sent a new verification link to your email.', { 
          id: toastId, 
          duration: 6000,
          icon: '📧'
        });
        
        // Optionally redirect to resend verification page
        setTimeout(() => {
          router.push('/resend-verification');
        }, 2000);
        
      } else if (errorMessage.includes('account') && errorMessage.includes('not exist')) {
        toast.error('No account found with this email. Please sign up first.', { 
          id: toastId, 
          duration: 5000,
          icon: '❌'
        });
      } else if (errorMessage.includes('password') || errorMessage.includes('credentials')) {
        toast.error('Invalid email or password. Please try again.', { 
          id: toastId, 
          duration: 4000,
          icon: '🔒'
        });
      } else {
        toast.error(errorMessage || 'Login failed. Please try again.', { 
          id: toastId, 
          duration: 4000,
          icon: '❌'
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle demo/login for testing (optional)
  const handleDemoLogin = () => {
    setEmail('demo@example.com');
    setPassword('demo12345');
  };

  if (isLoading) {
    return (
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
            <p style={{ color: '#6b7280' }}>Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Link href="/">
            <Image
              src="/kbl-logo-white.png"
              alt="Kigali Business Lab"
              width={120}
              height={60}
              priority
            />
          </Link>
        </div>

        <h1 className={styles.title}>Welcome Back</h1>

        <div className={styles.card}>
          <div className={styles.cardContent}>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
                <div className={styles.passwordWrapper}>
                  <Mail className={styles.inputIcon} />
                <input
                    type="email"
                  id="email"
                  placeholder="Enter your email address"
                    className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                    required
                  disabled={isLoggingIn}
                />
              </div>
            </div>

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                  <Link href="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
                </div>
                <div className={styles.passwordWrapper}>
                  <Lock className={styles.inputIcon} />
                <input
                    type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
                    className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                    required
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                    className={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoggingIn}
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
                className={styles.button}
              disabled={isLoggingIn || !email || !password}
              >
                {isLoggingIn ? 'Signing In...' : (
                <>
                  Sign In
                    <ArrowRight size={16} style={{ marginLeft: '0.5rem' }} />
                </>
              )}
            </button>

            {process.env.NODE_ENV === 'development' && (
              <button
                type="button"
                onClick={handleDemoLogin}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#6b7280',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
              >
                Fill Demo Credentials
              </button>
            )}
          </form>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                Need a new verification email?
              </p>
              <Link
                href="/resend-verification"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#0179d2',
                  textDecoration: 'none'
                }}
              >
                <Mail size={16} style={{ marginRight: '0.5rem' }} />
                Resend Verification Email
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.loginPrompt}>
            Don&apos;t have an account?{' '}
          <Link href="/signup">Create an account</Link>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
          <p>By continuing, you agree to our</p>
          <p>
            <Link href="/terms" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginPageContent />
    </Suspense>
  );
}
