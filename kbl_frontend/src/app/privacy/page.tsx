'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>

      <div style={{ lineHeight: '1.8', color: '#4b5563' }}>
        <p style={{ marginBottom: '1rem' }}>
          <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            1. Information We Collect
          </h2>
          <p>
            We collect information that you provide directly to us, including your name, email address, phone number, and business information when you use our Business Diagnostic Tool.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            2. How We Use Your Information
          </h2>
          <p>
            We use the information we collect to provide, maintain, and improve our services, process your assessments, and communicate with you about your account.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            3. Information Sharing
          </h2>
          <p>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            4. Data Security
          </h2>
          <p>
            We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            5. Your Rights
          </h2>
          <p>
            You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#111827' }}>
            6. Contact Us
          </h2>
          <p>
            If you have questions about this Privacy Policy, please contact us through your account or at the contact information provided in the application.
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

