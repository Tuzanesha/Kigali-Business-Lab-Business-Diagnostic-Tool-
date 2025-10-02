'use client';

import React, { useState } from 'react';
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
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); console.log('Saving profile data:', profileData); };
    return (<div className="profile-card"><h2 className="profile-card-header">MY PROFILE</h2><div className="avatar-section"><div className="avatar">JS</div><div className="avatar-actions"><Button variant="primary">Upload Photo</Button><Button variant="secondary">Remove</Button></div></div><form className="profile-form" onSubmit={handleSubmit}><FormInput id="fullName" label="Full Name" value={profileData.fullName} onChange={handleChange} /><FormInput id="email" label="Email Address" type="email" value={profileData.email} onChange={handleChange} /><FormInput id="role" label="Role / Title" value={profileData.role} onChange={handleChange} /><div className="form-actions"><Button type="submit" variant="primary">Save Changes</Button></div></form></div>);
};

const AccountContent = () => {
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setPasswordData(prev => ({...prev, [name]: value})); };
    const handlePasswordSubmit = (e: React.FormEvent) => { e.preventDefault(); if (passwordData.new !== passwordData.confirm) { alert("New passwords do not match!"); return; } console.log("Updating password..."); };
    const handleDeleteAccount = () => { if (window.confirm("Are you sure?")) { console.log("Deleting account..."); } };
    return (<div><div className="settings-card"><h2 className="settings-card-header">CHANGE PASSWORD</h2><form className="settings-form" onSubmit={handlePasswordSubmit}><FormInput id="current" label="Current Password" type="password" value={passwordData.current} onChange={handleChange} required /><FormInput id="new" label="New Password" type="password" value={passwordData.new} onChange={handleChange} required /><FormInput id="confirm" label="Confirm New Password" type="password" value={passwordData.confirm} onChange={handleChange} required /><div className="form-actions"><Button type="submit" variant="primary">Update Password</Button></div></form></div><div className="danger-zone"><h3 className="danger-zone-header">DANGER ZONE</h3><p className="danger-zone-text">Deleting your account is permanent and cannot be undone.</p><Button variant="danger" onClick={handleDeleteAccount}>Delete My Account</Button></div></div>);
};

const EnterpriseProfileContent = () => {
    const [details, setDetails] = useState({ businessName: 'KBL Solutions Inc.', location: 'New York, NY', yearFounded: '2020', legalStructure: '', description: 'Providing innovative business solutions.', fullTime: '25', partTime: '5', revenue: '1500000' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setDetails(prev => ({ ...prev, [name]: value })); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); console.log('Saving Enterprise Profile:', details); };
    return (<div className="settings-card"><h2 className="settings-card-header">Enterprise Details</h2><form className="settings-form" onSubmit={handleSubmit}><div className="form-grid"><h3 className="form-subheading">Core Details</h3><FormInput id="businessName" label="Business Name" value={details.businessName} onChange={handleChange} /><FormInput id="location" label="Location" value={details.location} onChange={handleChange} /><FormInput id="yearFounded" label="Year Founded" type="number" value={details.yearFounded} onChange={handleChange} /><FormSelect id="legalStructure" label="Legal Structure" value={details.legalStructure} onChange={handleChange}><option value="" disabled>Select legal structure</option><option value="llc">LLC</option><option value="s-corp">S Corporation</option></FormSelect><FormTextarea id="description" label="Brief Description" value={details.description} onChange={handleChange} /><h3 className="form-subheading">Company Figures</h3><FormInput id="fullTime" label="Full-time Employees" type="number" value={details.fullTime} onChange={handleChange} /><FormInput id="partTime" label="Part-time Employees" type="number" value={details.partTime} onChange={handleChange} /><FormInput id="revenue" label="Total Revenue This Year (USD)" type="number" value={details.revenue} onChange={handleChange} /><div className="form-actions grid-col-span-full"><Button type="submit" variant="primary">Save Enterprise Details</Button></div></div></form></div>);
};

const NotificationsContent = () => {
    const [prefs, setPrefs] = useState({ email: true, push: false, reports: true, marketing: false });
    const handleToggle = (key: keyof typeof prefs) => { setPrefs(prev => ({ ...prev, [key]: !prev[key] })); };
    const notificationItems = [
        { key: 'email', title: 'Email Notifications', description: 'Receive updates about your projects and account' },
        { key: 'push', title: 'Push Notifications', description: 'Get notified about important updates on your device' },
        { key: 'reports', title: 'Weekly Reports', description: 'Receive weekly summaries of your activity' },
        { key: 'marketing', title: 'Marketing Communications', description: 'Receive news about new features and updates' },
    ];
    return (<div className="settings-card"><h2 className="settings-card-header">NOTIFICATION PREFERENCES</h2><div className="notification-list">{notificationItems.map(item => (<div key={item.key} className="notification-item"><div className="notification-text"><h3 className="notification-title">{item.title}</h3><p className="notification-description">{item.description}</p></div><label className="toggle-switch"><input type="checkbox" checked={prefs[item.key as keyof typeof prefs]} onChange={() => handleToggle(item.key as keyof typeof prefs)} /><span className="toggle-slider"></span></label></div>))}</div></div>);
};



export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');
  const tabs = ['Profile', 'Account', 'Enterprise Profile', 'Notifications'];

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
        {activeTab === 'Notifications' && <NotificationsContent />}
      </main>
    </div>
  );
}