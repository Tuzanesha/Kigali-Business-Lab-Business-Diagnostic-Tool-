'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function TermsPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <Link href="/">
          <Image
            src="/kbl-logo-blue.png"
            alt="KBL Logo"
            width={120}
            height={48}
            priority
          />
        </Link>
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1f2937' }}>
        Terms of Service
      </h1>

      <div style={{ lineHeight: '1.8', color: '#4b5563' }}>
        <p style={{ marginBottom: '1rem' }}>
          <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and using the Kigali Business Lab Business Diagnostic Tool, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            2. Use License
          </h2>
          <p>
            Permission is granted to temporarily use the Business Diagnostic Tool for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            3. User Account
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            4. Data and Privacy
          </h2>
          <p>
            Your use of the service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            5. Limitation of Liability
          </h2>
          <p>
            Kigali Business Lab shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
          </p>
        </section>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <Link 
            href="/login" 
            style={{ 
              color: '#0179d2', 
              textDecoration: 'underline',
              fontWeight: 500
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

