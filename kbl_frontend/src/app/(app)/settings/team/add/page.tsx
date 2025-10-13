'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import '../../../settings/settings.css';

const Button = ({ children, variant = 'primary', type = 'button' }: { children: React.ReactNode, variant?: string, type?: 'button' | 'submit' | 'reset' }) => {
    const className = `button button-${variant}`;
    return (<button type={type} className={className}>{children}</button>);
};

const FormInput = ({ id, label, type = 'text', value, onChange }: { id: string, label: string, type?: string, value: string, onChange: React.ChangeEventHandler<HTMLInputElement> }) => {
    return (<div className="form-group"><label htmlFor={id} className="form-label">{label}</label><input type={type} id={id} name={id} value={value} onChange={onChange} className="form-input" required /></div>);
};

export default function AddTeamMemberPage() {
    const router = useRouter();
    const [memberData, setMemberData] = useState({
        fullName: '',
        email: '',
        role: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMemberData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const addPromise = new Promise(resolve => setTimeout(resolve, 1500));

        toast.promise(addPromise, {
            loading: 'Adding new member...',
            success: 'Team member added successfully!',
            error: 'Could not add member.',
        });

        addPromise.then(() => {
            router.push('/settings');
        });
    };

    return (
        <div className="settings-page">
            <header className="page-header">
                <h1 className="page-title">Add New Team Member</h1>
            </header>
            <div className="settings-card">
                <form className="settings-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <FormInput id="fullName" label="Full Name" value={memberData.fullName} onChange={handleChange} />
                        <FormInput id="email" label="Email Address" type="email" value={memberData.email} onChange={handleChange} />
                        <FormInput id="role" label="Role / Priority" value={memberData.role} onChange={handleChange} />

                    </div>
                    <div className="form-actions">
                        <Link href="/settings" className="button button-secondary">Cancel</Link>
                        <Button type="submit" variant="primary">Add Member</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}