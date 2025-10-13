'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import './settings.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: 'primary' | 'secondary' | 'danger';
  type?: 'button' | 'submit' | 'reset';
}

interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  value: string | number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
}

interface FormSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
}

interface FormTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
}

const Button = ({ children, onClick, variant = 'primary', type = 'button' }: ButtonProps) => {
    const className = `button button-${variant}`;
    return (<button type={type} className={className} onClick={onClick}>{children}</button>);
};

const FormInput = ({ id, label, type = 'text', value, onChange, required = false }: FormInputProps) => {
    return (<div className="form-group"><label htmlFor={id} className="form-label">{label}</label><input type={type} id={id} name={id} value={value} onChange={onChange} className="form-input" required={required} /></div>);
};

const FormSelect = ({ id, label, value, onChange, children }: FormSelectProps) => {
    return (<div className="form-group"><label htmlFor={id} className="form-label">{label}</label><select id={id} name={id} value={value} onChange={onChange} className="form-select">{children}</select></div>);
};

const FormTextarea = ({ id, label, value, onChange }: FormTextareaProps) => {
    return (<div className="form-group grid-col-span-full"><label htmlFor={id} className="form-label">{label}</label><textarea id={id} name={id} value={value} onChange={onChange} className="form-textarea" /></div>);
};

const ProfileContent = () => {
    const [profileData, setProfileData] = useState({ fullName: 'John Smith', email: 'john.smith@example.com', role: 'Administrator' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setProfileData(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const savePromise = new Promise(resolve => setTimeout(resolve, 1500)); toast.promise(savePromise, { loading: 'Saving profile...', success: 'Profile updated successfully!', error: 'Could not save profile.' }); };
    return (<div className="profile-card"><h2 className="profile-card-header">MY PROFILE</h2><div className="avatar-section"><div className="avatar">JS</div><div className="avatar-actions"><Button variant="primary">Upload Photo</Button><Button variant="secondary">Remove</Button></div></div><form className="profile-form" onSubmit={handleSubmit}><FormInput id="fullName" label="Full Name" value={profileData.fullName} onChange={handleChange} /><FormInput id="email" label="Email Address" type="email" value={profileData.email} onChange={handleChange} /><FormInput id="role" label="Role / Title" value={profileData.role} onChange={handleChange} /><div className="form-actions"><Button type="submit" variant="primary">Save Changes</Button></div></form></div>);
};

const AccountContent = () => {
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setPasswordData(prev => ({...prev, [name]: value})); };
    const handlePasswordSubmit = (e: React.FormEvent) => { e.preventDefault(); if (passwordData.new !== passwordData.confirm) { toast.error("New passwords do not match!"); return; } const passwordPromise = new Promise((resolve, reject) => setTimeout(() => resolve('Success'), 1500)); toast.promise(passwordPromise, { loading: 'Updating password...', success: 'Password updated successfully!', error: 'Failed to update password.' }); };
    const handleDeleteAccount = () => { if (window.confirm("Are you sure you want to delete your account? This action is permanent.")) { const deletePromise = new Promise(resolve => setTimeout(resolve, 2000)); toast.promise(deletePromise, { loading: 'Deleting account...', success: 'Account deleted.', error: 'Could not delete account.' }); } };
    return (<div><div className="settings-card"><h2 className="settings-card-header">CHANGE PASSWORD</h2><form className="settings-form" onSubmit={handlePasswordSubmit}><FormInput id="current" label="Current Password" type="password" value={passwordData.current} onChange={handleChange} required /><FormInput id="new" label="New Password" type="password" value={passwordData.new} onChange={handleChange} required /><FormInput id="confirm" label="Confirm New Password" type="password" value={passwordData.confirm} onChange={handleChange} required /><div className="form-actions"><Button type="submit" variant="primary">Update Password</Button></div></form></div><div className="danger-zone"><h3 className="danger-zone-header">DANGER ZONE</h3><p className="danger-zone-text">Deleting your account is permanent and cannot be undone.</p><Button variant="danger" onClick={handleDeleteAccount}>Delete My Account</Button></div></div>);
};

const EnterpriseProfileContent = () => {
    const [enterpriseData, setEnterpriseData] = useState({ name: 'KBL Solutions Inc.', location: 'New York, NY', contact_person: 'Jane Doe', phone_number: '123-456-7890', email: 'contact@kblsolutions.com', year_founded: 2020, legal_structure: '', owner_background: '', description: 'Providing innovative business solutions.', key_partners: '', full_time_employees_total: 25, full_time_employees_female: 15, part_time_employees_total: 5, part_time_employees_female: 3, revenue_this_year: 1500000.00, revenue_last_year: 1200000.00, units_sold_this_year: '5000', units_sold_last_year: '4000', num_suppliers: 10, num_customers: 200, total_funding: 50000.00, short_term_plans: '', medium_term_plans: '', long_term_plans: '', market_linkage_needs: '', finance_needs_amount: 10000.00, key_assistance_areas: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { const { name, value, type } = e.target; const isNumberField = type === 'number'; const finalValue = isNumberField ? (value === '' ? '' : parseFloat(value)) : value; setEnterpriseData(prev => ({ ...prev, [name]: finalValue })); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const savePromise = new Promise(resolve => setTimeout(resolve, 1500)); toast.promise(savePromise, { loading: 'Saving enterprise profile...', success: 'Profile saved successfully!', error: 'Failed to save profile.' }); };
    return (<div className="settings-card"><h2 className="settings-card-header">Enterprise Profile</h2><form className="settings-form" onSubmit={handleSubmit}><div className="form-grid"><h3 className="form-subheading grid-col-span-full">Core Information</h3><FormInput id="name" label="Enterprise Name" value={enterpriseData.name} onChange={handleChange} /><FormInput id="location" label="Location" value={enterpriseData.location} onChange={handleChange} /><FormInput id="contact_person" label="Contact Person" value={enterpriseData.contact_person} onChange={handleChange} /><FormInput id="phone_number" label="Phone Number" type="tel" value={enterpriseData.phone_number} onChange={handleChange} /><FormInput id="email" label="Email" type="email" value={enterpriseData.email} onChange={handleChange} /><FormInput id="year_founded" label="Year Founded" type="number" value={enterpriseData.year_founded} onChange={handleChange} /><FormInput id="legal_structure" label="Legal Structure" value={enterpriseData.legal_structure} onChange={handleChange} /><FormInput id="owner_background" label="Owner Background" value={enterpriseData.owner_background} onChange={handleChange} /><FormTextarea id="description" label="Brief Description" value={enterpriseData.description} onChange={handleChange} /><h3 className="form-subheading grid-col-span-full">Operations & Partners</h3><FormInput id="num_suppliers" label="Number of Suppliers" type="number" value={enterpriseData.num_suppliers} onChange={handleChange} /><FormInput id="num_customers" label="Number of Customers" type="number" value={enterpriseData.num_customers} onChange={handleChange} /><FormTextarea id="key_partners" label="Key Partners" value={enterpriseData.key_partners} onChange={handleChange} /><h3 className="form-subheading grid-col-span-full">Employee Information</h3><FormInput id="full_time_employees_total" label="Total Full-time Employees" type="number" value={enterpriseData.full_time_employees_total} onChange={handleChange} /><FormInput id="full_time_employees_female" label="Female Full-time Employees" type="number" value={enterpriseData.full_time_employees_female} onChange={handleChange} /><FormInput id="part_time_employees_total" label="Total Part-time Employees" type="number" value={enterpriseData.part_time_employees_total} onChange={handleChange} /><FormInput id="part_time_employees_female" label="Female Part-time Employees" type="number" value={enterpriseData.part_time_employees_female} onChange={handleChange} /><h3 className="form-subheading grid-col-span-full">Financial Performance</h3><FormInput id="revenue_this_year" label="Revenue This Year (USD)" type="number" value={enterpriseData.revenue_this_year} onChange={handleChange} /><FormInput id="revenue_last_year" label="Revenue Last Year (USD)" type="number" value={enterpriseData.revenue_last_year} onChange={handleChange} /><FormInput id="units_sold_this_year" label="Units Sold This Year" value={enterpriseData.units_sold_this_year} onChange={handleChange} /><FormInput id="units_sold_last_year" label="Units Sold Last Year" value={enterpriseData.units_sold_last_year} onChange={handleChange} /><h3 className="form-subheading grid-col-span-full">Funding & Needs</h3><FormInput id="total_funding" label="Total Funding to Date (USD)" type="number" value={enterpriseData.total_funding} onChange={handleChange} /><FormInput id="finance_needs_amount" label="Current Finance Needs (USD)" type="number" value={enterpriseData.finance_needs_amount} onChange={handleChange} /><FormTextarea id="market_linkage_needs" label="Market Linkage Needs" value={enterpriseData.market_linkage_needs} onChange={handleChange} /><FormTextarea id="key_assistance_areas" label="Key Areas Where Assistance is Needed" value={enterpriseData.key_assistance_areas} onChange={handleChange} /><h3 className="form-subheading grid-col-span-full">Strategic Plans</h3><FormTextarea id="short_term_plans" label="Short-term Plans" value={enterpriseData.short_term_plans} onChange={handleChange} /><FormTextarea id="medium_term_plans" label="Medium-term Plans" value={enterpriseData.medium_term_plans} onChange={handleChange} /><FormTextarea id="long_term_plans" label="Long-term Plans" value={enterpriseData.long_term_plans} onChange={handleChange} /><div className="form-actions grid-col-span-full"><Button type="submit" variant="primary">Save Enterprise Profile</Button></div></div></form></div>);
};

const TeamContent = () => {
    const initialTeam = [
        { id: 1, name: 'John Doe', role: 'Admin', email: 'john.doe@example.com' },
        { id: 2, name: 'Jane Smith', role: 'Manager', email: 'jane.smith@example.com' },
        { id: 3, name: 'Peter Jones', role: 'Member', email: 'peter.jones@example.com' },
    ];
    const [team, setTeam] = useState(initialTeam);

    const handleDelete = (memberId: number) => {
        if (window.confirm('Are you sure you want to remove this team member?')) {
            const deletePromise = new Promise<void>(resolve => {
                setTimeout(() => {
                    setTeam(prev => prev.filter(member => member.id !== memberId));
                    resolve();
                }, 1000);
            });
            toast.promise(deletePromise, {
                loading: 'Removing member...',
                success: 'Team member removed.',
                error: 'Could not remove member.',
            });
        }
    };

    return (
        <div className="settings-card">
            <div className="team-header">
                <h2 className="settings-card-header" style={{border: 'none', padding: 0, margin: 0}}>Manage Team</h2>
                <Link href="/settings/team/add" className="button button-primary">
                    <PlusCircle size={18} style={{marginRight: '0.5rem'}}/>
                    Add New Member
                </Link>
            </div>
            <div className="team-list-container">
                {team.map(member => (
                    <div key={member.id} className="team-member-item">
                        <span className="team-member-name">{member.name}</span>
                        <span className="team-member-role">{member.role}</span>
                        <span className="team-member-email">{member.email}</span>
                        <div className="team-member-actions">
                            <Link href={`/settings/team/${member.id}/edit`} className="button button-secondary">
                                <Edit size={16} />
                            </Link>
                            <Button variant="danger" onClick={() => handleDelete(member.id)}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const NotificationsContent = () => {
    const [prefs, setPrefs] = useState({ email: true, push: false, reports: true, marketing: false });
    const handleToggle = (key: keyof typeof prefs) => { setPrefs(prev => { const newPrefs = { ...prev, [key]: !prev[key] }; toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} notifications ${newPrefs[key] ? 'enabled' : 'disabled'}.`); return newPrefs; }); };
    const notificationItems = [ { key: 'email', title: 'Email Notifications', description: 'Receive updates about your projects and account' }, { key: 'push', title: 'Push Notifications', description: 'Get notified about important updates on your device' }, { key: 'reports', title: 'Weekly Reports', description: 'Receive weekly summaries of your activity' }, { key: 'marketing', title: 'Marketing Communications', description: 'Receive news about new features and updates' }, ];
    return (<div className="settings-card"><h2 className="settings-card-header">NOTIFICATION PREFERENCES</h2><div className="notification-list">{notificationItems.map(item => (<div key={item.key} className="notification-item"><div className="notification-text"><h3 className="notification-title">{item.title}</h3><p className="notification-description">{item.description}</p></div><label className="toggle-switch"><input type="checkbox" checked={prefs[item.key as keyof typeof prefs]} onChange={() => handleToggle(item.key as keyof typeof prefs)} /><span className="toggle-slider"></span></label></div>))}</div></div>);
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');
  const tabs = ['Profile', 'Account', 'Enterprise Profile', 'Team', 'Notifications'];

  return (
    <div className="settings-page">
      <header className="page-header">
        <h1 className="page-title">SETTINGS</h1>
        <nav className="tabs-nav">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>
      <main className="tab-content">
        {activeTab === 'Profile' && <ProfileContent />}
        {activeTab === 'Account' && <AccountContent />}
        {activeTab === 'Enterprise Profile' && <EnterpriseProfileContent />}
        {activeTab === 'Team' && <TeamContent />}
        {activeTab === 'Notifications' && <NotificationsContent />}
      </main>
    </div>
  );
}