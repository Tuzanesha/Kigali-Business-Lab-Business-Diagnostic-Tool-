'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import '../../../../settings/settings.css';

const mockTeamData = [
    { id: '1', fullName: 'John Doe', email: 'john.doe@example.com', role: 'Admin' },
    { id: '2', fullName: 'Jane Smith', email: 'jane.smith@example.com', role: 'Manager' },
    { id: '3', fullName: 'Peter Jones', email: 'peter.jones@example.com', role: 'Member' },
];

const Button = ({ children, variant = 'primary', type = 'button' }: { children: React.ReactNode, variant?: string, type?: 'button' | 'submit' | 'reset' }) => {
    const className = `button button-${variant}`;
    return (<button type={type} className={className}>{children}</button>);
};

const FormInput = ({ id, label, type = 'text', value, onChange }: { id: string, label: string, type?: string, value: string, onChange: React.ChangeEventHandler<HTMLInputElement> }) => {
    return (<div className="form-group"><label htmlFor={id} className="form-label">{label}</label><input type={type} id={id} name={id} value={value} onChange={onChange} className="form-input" required /></div>);
};

export default function EditTeamMemberPage() {
    const router = useRouter();
    const params = useParams();
    const memberId = params.memberId as string;

    const [memberData, setMemberData] = useState({
        fullName: '',
        email: '',
        role: '',
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMemberData = () => {
            const member = mockTeamData.find(m => m.id === memberId);
            if (member) {
                setMemberData(member);
            } else {
                toast.error('Team member not found.');
                router.push('/settings');
            }
            setIsLoading(false);
        };
        fetchMemberData();
    }, [memberId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMemberData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const savePromise = new Promise(resolve => setTimeout(resolve, 1500));

        toast.promise(savePromise, {
            loading: `Saving changes for ${memberData.fullName}...`,
            success: 'Member updated successfully!',
            error: 'Could not save changes.',
        });

        savePromise.then(() => {
            router.push('/settings');
        });
    };

    if (isLoading) {
        return <div className="settings-page">Loading...</div>;
    }

    return (
        <div className="settings-page">
            <header className="page-header">
                <h1 className="page-title">Edit Team Member</h1>
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
                        <Button type="submit" variant="primary">Save Changes</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}