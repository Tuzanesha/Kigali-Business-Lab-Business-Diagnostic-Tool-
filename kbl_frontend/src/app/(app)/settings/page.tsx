'use client';

import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import './settings.css';
import { useRouter } from 'next/navigation';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { 
  profileApi,
  authApi,
  notificationsApi,
  enterpriseApi,
  teamApi,
  getAccessToken
} from '@/lib/api';

declare global {
  // This fixes the JSX namespace error
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

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

const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false }: ButtonProps & { disabled?: boolean }) => {
    const className = `button button-${variant}`;
    return (
        <button 
            type={type} 
            className={className} 
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
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


interface ProfileData {
    fullName: string;
    email: string;
    phone: string;
    title: string;
    avatarUrl: string;
}

const ProfileContent = () => {
    const router = useRouter();
    
    // Refs
    const imgRef = useRef<HTMLImageElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // State
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [imgSrc, setImgSrc] = useState('');
    const [showCropModal, setShowCropModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<ProfileData>({ 
        fullName: '', 
        email: '', 
        phone: '',
        title: '',
        avatarUrl: ''
    });

    // Function to get user initials for avatar
    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const loadProfile = async () => {
        const access = getAccessToken();
        if (!access) {
            router.push('/login');
            return;
        }

        try {
            const p = await profileApi.get(access);
            const fullName = (p.full_name || `${p.first_name || ''} ${p.last_name || ''}`).trim();
            setProfileData({
                fullName,
                email: p.email || '',
                phone: p.phone || '',
                title: p.title || '',
                avatarUrl: p.avatar_url || ''
            });
            
            // Try to get role from team portal (for team members)
            try {
                const portalData = await teamApi.getPortal(access);
                if (portalData.user?.role) {
                    setUserRole(portalData.user.role);
                }
            } catch {
                // Not a team member or error fetching role - that's okay
            }
        } catch (e: any) {
            toast.error(e?.message || 'Could not load profile.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() || '');
                setShowCropModal(true);
            });
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const size = Math.min(width, height);
        setCrop({
            unit: '%',
            width: 100,
            x: 0,
            y: 0,
            height: 100 * (height / width)
        });
    };

    const getCroppedImg = async (image: HTMLImageElement, crop: Crop): Promise<Blob> => {
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const pixelRatio = window.devicePixelRatio;
        
        canvas.width = crop.width * pixelRatio;
        canvas.height = crop.height * pixelRatio;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No 2d context');

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width,
            crop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (!blob) throw new Error('Canvas is empty');
                    resolve(blob);
                },
                'image/jpeg',
                0.9
            );
        });
    };

    const handleCropComplete = async () => {
        if (!imgRef.current || !completedCrop) return;

        try {
            setIsUploading(true);
            const croppedImage = await getCroppedImg(imgRef.current, completedCrop);
            
            const access = getAccessToken();
            if (!access) throw new Error('Not authenticated');
            
            const file = new File([croppedImage], 'profile.jpg', { type: 'image/jpeg' });
            const result = await profileApi.uploadAvatar(access, file);
            
            setProfileData((prev: ProfileData) => ({
                ...prev,
                avatarUrl: `${result.avatar_url}?${new Date().getTime()}` // Add timestamp to force refresh
            }));
            
            setShowCropModal(false);
            toast.success('Profile picture updated successfully!');
            
            // Dispatch event to update sidebar
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (e: any) {
            toast.error(e?.message || 'Failed to upload profile picture');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        const access = getAccessToken();
        if (!access) {
            router.push('/login');
            return;
        }

        try {
            await profileApi.removeAvatar(access);
            setProfileData(prev => ({
                ...prev,
                avatarUrl: ''
            }));
            toast.success('Profile picture removed');
            
            // Dispatch event to update sidebar
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (e: any) {
            toast.error(e?.message || 'Failed to remove profile picture');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const access = getAccessToken();
        if (!access) {
            router.push('/login');
            return;
        }

        try {
            const [firstName, ...lastName] = profileData.fullName.split(' ');
            await profileApi.update(access, {
                first_name: firstName,
                last_name: lastName.join(' '),
                email: profileData.email,
                phone: profileData.phone,
                title: profileData.title
            });
            toast.success('Profile updated successfully!');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update profile');
        }
    };

    // Cleanup function for the crop modal
    useEffect(() => {
        return () => {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
    }, []);

    if (isLoading) {
        return <div>Loading profile...</div>;
    }


    return (
        <div className="profile-card">
            <h2 className="profile-card-header">MY PROFILE</h2>
            
            <div className="avatar-section">
                {profileData.avatarUrl ? (
                    <div className="avatar-container">
                        <img 
                            src={profileData.avatarUrl} 
                            alt="Profile" 
                            className="avatar-image"
                            ref={imgRef}
                        />
                    </div>
                ) : (
                    <div className="avatar">
                        {getInitials(profileData.fullName || 'U')}
                    </div>
                )}
                <div className="avatar-actions">
                    <label className="button button-primary" style={{ cursor: 'pointer' }}>
                        {profileData.avatarUrl ? 'Change Photo' : 'Upload Photo'}
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            style={{ display: 'none' }} 
                            accept="image/*"
                            onChange={onSelectFile}
                        />
                    </label>
                    {profileData.avatarUrl && (
                        <Button 
                            variant="secondary" 
                            onClick={handleRemoveAvatar}
                            disabled={isUploading}
                        >
                            {isUploading ? 'Removing...' : 'Remove'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Crop Modal */}
            {showCropModal && (
                <div className="crop-modal">
                    <div className="crop-modal-content">
                        <h3>Crop Profile Picture</h3>
                        <div className="crop-container">
                            {imgSrc && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={c => setCrop(c)}
                                    onComplete={c => setCompletedCrop(c)}
                                    aspect={1}
                                    circularCrop
                                >
                                    <img
                                        ref={imgRef}
                                        src={imgSrc}
                                        onLoad={onImageLoad}
                                        alt="Crop preview"
                                        style={{ maxWidth: '100%', maxHeight: '60vh' }}
                                    />
                                </ReactCrop>
                            )}
                        </div>
                        <div className="crop-actions">
                            <Button 
                                variant="secondary" 
                                onClick={() => {
                                    setShowCropModal(false);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                                disabled={isUploading}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleCropComplete}
                                disabled={!completedCrop || isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .crop-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .crop-modal-content {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    max-width: 90%;
                    max-height: 90vh;
                    overflow: auto;
                }
                .crop-container {
                    margin: 20px 0;
                    display: flex;
                    justify-content: center;
                }
                .crop-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                .avatar-container {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 3px solid #e2e8f0;
                }
                .avatar-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            `}</style>
            
            <form className="profile-form" onSubmit={handleSubmit}>
                <FormInput 
                    id="fullName" 
                    label="Full Name" 
                    value={profileData.fullName} 
                    onChange={handleChange} 
                    required
                />
                <FormInput 
                    id="email" 
                    label="Email Address" 
                    type="email" 
                    value={profileData.email} 
                    onChange={handleChange}
                    required
                />
                <FormInput 
                    id="phone" 
                    label="Phone Number" 
                    type="tel" 
                    value={profileData.phone} 
                    onChange={handleChange}
                />
                {userRole && (
                    <div className="form-group">
                        <label className="form-label">Team Role</label>
                        <div style={{ 
                            padding: '0.75rem', 
                            background: '#f1f5f9', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '0.375rem',
                            color: '#475569',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            fontSize: '0.875rem'
                        }}>
                            {userRole === 'ADMIN' ? 'Administrator' : 
                             userRole === 'MANAGER' ? 'Manager' : 
                             userRole === 'MEMBER' ? 'Team Member' : userRole}
                        </div>
                        <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                            Your role is assigned by the enterprise owner
                        </p>
                    </div>
                )}
                <FormInput 
                    id="title" 
                    label="Job Title / Role" 
                    value={profileData.title} 
                    onChange={handleChange}
                />
                
                <div className="form-actions">
                    <Button type="submit" variant="primary">
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
};

const AccountContent = () => {
    const router = useRouter();
    const [passwordData, setPasswordData] = useState({ 
        current: '', 
        new: '', 
        confirm: '' 
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
        const { name, value } = e.target; 
        setPasswordData(prev => ({...prev, [name]: value})); 
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwordData.new !== passwordData.confirm) {
            toast.error('New passwords do not match');
            return;
        }

        const id = toast.loading('Updating password...');
        setIsLoading(true);
        
        try {
            const access = getAccessToken();
            if (!access) throw new Error('Not authenticated');
            
            await profileApi.changePassword(
                access,
                passwordData.current,
                passwordData.new,
                passwordData.confirm
            );
            
            // Clear the form
            setPasswordData({ current: '', new: '', confirm: '' });
            toast.success('Password updated successfully!', { id });
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update password', { id });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        const id = toast.loading('Deleting account...');
        try {
            const access = getAccessToken();
            if (!access) throw new Error('Not authenticated');
            
            await profileApi.deleteAccount(access);
            toast.success('Account deleted successfully', { id });
            
            // Clear local storage and redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('isLoggedIn');
            router.push('/login');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to delete account', { id });
        }
    };

    return (
        <div className="account-card">
            <h2 className="account-card-header">ACCOUNT SETTINGS</h2>
            
            <form className="account-form" onSubmit={handlePasswordSubmit}>
                <h3>Change Password</h3>
                <div className="form-group">
                    <label htmlFor="current" className="form-label">Current Password</label>
                    <input 
                        type="password" 
                        id="current" 
                        name="current" 
                        value={passwordData.current} 
                        onChange={handleChange} 
                        className="form-input" 
                        required 
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="new" className="form-label">New Password</label>
                    <input 
                        type="password" 
                        id="new" 
                        name="new" 
                        value={passwordData.new} 
                        onChange={handleChange} 
                        className="form-input" 
                        required 
                        minLength={8}
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirm" className="form-label">Confirm New Password</label>
                    <input 
                        type="password" 
                        id="confirm" 
                        name="confirm" 
                        value={passwordData.confirm} 
                        onChange={handleChange} 
                        className="form-input" 
                        required 
                        minLength={8}
                        disabled={isLoading}
                    />
                </div>
                <div className="form-actions">
                    <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={isLoading || !passwordData.current || !passwordData.new || passwordData.new !== passwordData.confirm}
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                </div>
            </form>
            
            <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>Deleting your account will permanently remove all your data. This action cannot be undone.</p>
                <Button 
                    variant="danger" 
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                >
                    {isLoading ? 'Deleting...' : 'Delete My Account'}
                </Button>
            </div>
        </div>
    );
};

const EnterpriseProfileContent = () => {
    const [enterpriseData, setEnterpriseData] = useState<Record<string, any>>({});
    const [hasEnterprise, setHasEnterprise] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const id = 'enterprise-load';
            toast.dismiss(id);
            toast.loading('Loading enterprise profile...', { id });
            try {
                const access = getAccessToken();
                if (!access) { 
                    toast.dismiss(id); 
                    return; 
                }
                const p = await enterpriseApi.getProfile(access);
                setEnterpriseData(prev => ({ ...prev, ...p }));
                setHasEnterprise(true);
                toast.success('Enterprise loaded', { id, duration: 2000 });
            } catch (e: any) {
                // If 404, user has no enterprise yet; leave form empty for creation-by-PUT behavior
                setHasEnterprise(false);
                toast.dismiss(id);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { 
        const { name, value, type } = e.target; 
        const isNumberField = type === 'number';
        const finalValue = isNumberField ? (value === '' ? '' : Number(value)) : value; 
        setEnterpriseData(prev => ({ ...prev, [name]: finalValue })); 
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const id = 'enterprise-save';
        toast.dismiss(id);
        toast.loading('Saving enterprise profile...', { id });
        try {
            const access = getAccessToken();
            if (!access) throw new Error('Not authenticated');
            
            // Filter out empty strings/nulls to avoid validation issues on numeric fields
            const raw = { ...enterpriseData };
            const payload: Record<string, any> = {};
            for (const [k, v] of Object.entries(raw)) {
                if (v === '' || v === null || v === undefined) continue;
                payload[k] = v;
            }
            
            let out;
            if (hasEnterprise) {
                out = await enterpriseApi.updateProfile(access, payload);
            } else {
                // Create a new enterprise (minimum required: name)
                out = await enterpriseApi.create(access, { 
                    name: payload.name || 'My Enterprise', 
                    ...payload 
                });
                setHasEnterprise(true);
            }
            
            setEnterpriseData(prev => ({ ...prev, ...out }));
            toast.success('Profile saved successfully! Now you can do an assessment for your enterprise', { 
                id, 
                duration: 2500 
            });
        } catch (e:any) {
            toast.error(e?.message || 'Failed to save profile.', { id, duration: 3000 });
        }
    };
    return (<div className="settings-card"><h2 className="settings-card-header">Enterprise Profile</h2><form className="settings-form" onSubmit={handleSubmit}><div className="form-grid"><h3 className="form-subheading grid-col-span-full">Core Information</h3><FormInput id="name" label="Enterprise Name" value={enterpriseData.name} onChange={handleChange} /><FormInput id="location" label="Location" value={enterpriseData.location} onChange={handleChange} /><FormInput id="contact_person" label="Contact Person" value={enterpriseData.contact_person} onChange={handleChange} /><FormInput id="phone_number" label="Phone Number" type="tel" value={enterpriseData.phone_number} onChange={handleChange} /><FormInput id="email" label="Email" type="email" value={enterpriseData.email} onChange={handleChange} /><FormInput id="year_founded" label="Year Founded" type="number" value={enterpriseData.year_founded} onChange={handleChange} /><FormInput id="legal_structure" label="Legal Structure" value={enterpriseData.legal_structure} onChange={handleChange} /><FormInput id="owner_background" label="Owner Background" value={enterpriseData.owner_background} onChange={handleChange} /><FormTextarea id="description" label="Brief Description" value={enterpriseData.description} onChange={handleChange} /><h3 className="form-subheading grid-col-span-full">Operations & Partners</h3><FormInput id="num_suppliers" label="Number of Suppliers" type="number" value={enterpriseData.num_suppliers} onChange={handleChange} /><FormInput id="num_customers" label="Number of Customers" type="number" value={enterpriseData.num_customers} onChange={handleChange} /><FormTextarea id="key_partners" label="Key Partners" value={enterpriseData.key_partners} onChange={handleChange} /><h3 className="form-subheading grid-col-span-full">Employee Information</h3><FormInput id="full_time_employees_total" label="Total Full-time Employees" type="number" value={enterpriseData.full_time_employees_total} onChange={handleChange} /><FormInput id="full_time_employees_female" label="Female Full-time Employees" type="number" value={enterpriseData.full_time_employees_female} onChange={handleChange} /><FormInput id="part_time_employees_total" label="Total Part-time Employees" type="number" value={enterpriseData.part_time_employees_total} onChange={handleChange} /><FormInput id="part_time_employees_female" label="Female Part-time Employees" type="number" value={enterpriseData.part_time_employees_female} onChange={handleChange} /><h3 className="form-subheading grid-col-span-full">Financial Performance</h3><FormInput id="revenue_this_year" label="Revenue This Year (USD)" type="number" value={enterpriseData.revenue_this_year} onChange={handleChange} /><FormInput id="revenue_last_year" label="Revenue Last Year (USD)" type="number" value={enterpriseData.revenue_last_year} onChange={handleChange} /><FormInput id="units_sold_this_year" label="Units Sold This Year" value={enterpriseData.units_sold_this_year} onChange={handleChange} /><FormInput id="units_sold_last_year" label="Units Sold Last Year" value={enterpriseData.units_sold_last_year} onChange={handleChange} /><h3 className="form-subheading grid-col-span-full">Funding & Needs</h3><FormInput id="total_funding" label="Total Funding to Date (USD)" type="number" value={enterpriseData.total_funding} onChange={handleChange} /><FormInput id="finance_needs_amount" label="Current Finance Needs (USD)" type="number" value={enterpriseData.finance_needs_amount} onChange={handleChange} /><FormTextarea id="market_linkage_needs" label="Market Linkage Needs" value={enterpriseData.market_linkage_needs} onChange={handleChange} /><FormTextarea id="key_assistance_areas" label="Key Areas Where Assistance is Needed" value={enterpriseData.key_assistance_areas} onChange={handleChange} /><h3 className="form-subheading grid-col-span-full">Strategic Plans</h3><FormTextarea id="short_term_plans" label="Short-term Plans" value={enterpriseData.short_term_plans} onChange={handleChange} /><FormTextarea id="medium_term_plans" label="Medium-term Plans" value={enterpriseData.medium_term_plans} onChange={handleChange} /><FormTextarea id="long_term_plans" label="Long-term Plans" value={enterpriseData.long_term_plans} onChange={handleChange} /><div className="form-actions grid-col-span-full"><Button type="submit" variant="primary">Save Enterprise Profile</Button></div></div></form></div>);
};

const TeamContent = () => {
    const [team, setTeam] = useState<Array<any>>([]);
    const [enterpriseId, setEnterpriseId] = useState<number | null>(null);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'ADMIN'|'MANAGER'|'MEMBER'>('MEMBER');

    useEffect(() => {
        const load = async () => {
            const id = toast.loading('Loading team...');
            try {
                const access = getAccessToken();
                if (!access) { toast.dismiss(id); return; }
                const ep = await enterpriseApi.getProfile(access);
                setEnterpriseId(ep?.id || null);
                const list = await teamApi.list(access);
                const items = Array.isArray(list?.results) ? list.results : (Array.isArray(list) ? list : []);
                setTeam(items);
                toast.success('Team loaded', { id });
            } catch (e:any) {
                toast.error(e?.message || 'Failed to load team', { id });
            }
        };
        load();
    }, []);

    const refresh = async () => {
        try {
            const access = getAccessToken();
            if (!access) return;
            const list = await teamApi.list(access);
            const items = Array.isArray(list?.results) ? list.results : (Array.isArray(list) ? list : []);
            setTeam(items);
        } catch {}
    };

    const handleAdd = async () => {
        if (!enterpriseId) { toast.error('Please create your enterprise profile first'); return; }
        if (!email.trim()) { toast.error('Enter an email'); return; }
        const id = toast.loading('Inviting member...');
        try {
            const access = getAccessToken();
            if (!access) {
                toast.error('Not authenticated', { id });
                router.push('/login');
                return;
            }
            await teamApi.create(access, { enterprise: enterpriseId, email: email.trim(), role });
            setEmail('');
            setRole('MEMBER');
            await refresh();
            toast.success('Invitation created', { id });
        } catch (e:any) {
            toast.error(e?.message || 'Failed to add member', { id });
        }
    };

    const handleRoleChange = async (idValue: number, newRole: 'ADMIN'|'MANAGER'|'MEMBER') => {
        const id = toast.loading('Updating role...');
        try {
            const access = getAccessToken();
            if (!access) {
                toast.error('Not authenticated', { id });
                router.push('/login');
                return;
            }
            await teamApi.update(access, idValue, { role: newRole });
            await refresh();
            toast.success('Role updated', { id });
        } catch (e:any) {
            toast.error(e?.message || 'Failed to update role', { id });
        }
    };

    const handleDelete = async (memberId: number) => {
        if (!window.confirm('Are you sure you want to remove this team member?')) return;
        const id = toast.loading('Removing member...');
        try {
            const access = getAccessToken();
            if (!access) {
                toast.error('Not authenticated', { id });
                router.push('/login');
                return;
            }
            await teamApi.delete(access, memberId);
            await refresh();
            toast.success('Team member removed', { id });
        } catch (e:any) {
            toast.error(e?.message || 'Could not remove member', { id });
        }
    };

    return (
        <div className="settings-card">
            <div className="team-header">
                <h2 className="settings-card-header" style={{border: 'none', padding: 0, margin: 0}}>Manage Team</h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input className="form-input" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} />
                    <select className="form-select" value={role} onChange={e=>setRole(e.target.value as any)}>
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="MEMBER">Member</option>
                    </select>
                    <button className="button button-primary" onClick={handleAdd}>
                        <PlusCircle size={18} style={{marginRight: '0.5rem'}}/>
                        Add Member
                    </button>
                </div>
            </div>
            <div className="team-list-container">
                {team.map(member => (
                    <div key={member.id} className="team-member-item">
                        <span className="team-member-name">{member.email}</span>
                        <span className="team-member-role">
                            <select className="form-select" value={member.role} onChange={e=>handleRoleChange(member.id, e.target.value as any)}>
                                <option value="ADMIN">Admin</option>
                                <option value="MANAGER">Manager</option>
                                <option value="MEMBER">Member</option>
                            </select>
                        </span>
                        <span className="team-member-email">{member.status}</span>
                        <div className="team-member-actions">
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
    const router = useRouter();
    const [prefs, setPrefs] = useState({ email_notifications: true, push_notifications: false, weekly_reports: true, marketing_communications: false });
    useEffect(() => {
        const load = async () => {
            const id = toast.loading('Loading notifications...');
            try {
                const access = getAccessToken();
                if (!access) { toast.dismiss(id); router.push('/login'); return; }
                const n = await notificationsApi.get(access);
                setPrefs({
                    email_notifications: !!n.email_notifications,
                    push_notifications: !!n.push_notifications,
                    weekly_reports: !!n.weekly_reports,
                    marketing_communications: !!n.marketing_communications,
                });
                toast.success('Preferences loaded', { id });
            } catch (e:any) { toast.error(e?.message || 'Failed to load notifications.', { id }); }
        };
        load();
    }, [router]);
    const toggle = async (key: keyof typeof prefs) => {
        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        try {
            const access = getAccessToken();
            if (!access) {
                toast.error('Not authenticated');
                router.push('/login');
                return;
            }
            await notificationsApi.update(access, next);
            toast.success('Preferences updated');
        } catch (e:any) {
            toast.error(e?.message || 'Failed to update preferences');
            // Revert on error
            setPrefs(prefs);
        }
    };
    const notificationItems = [
        { key: 'email_notifications', title: 'Email Notifications', description: 'Receive updates about your projects and account' },
        { key: 'push_notifications', title: 'Push Notifications', description: 'Get notified about important updates on your device' },
        { key: 'weekly_reports', title: 'Weekly Reports', description: 'Receive weekly summaries of your activity' },
        { key: 'marketing_communications', title: 'Marketing Communications', description: 'Receive news about new features and updates' },
    ] as const;
    const handleTestNotification = async () => {
        const id = toast.loading('Sending test notification...');
        try {
            const access = getAccessToken();
            if (!access) {
                toast.error('Not authenticated', { id });
                router.push('/login');
                return;
            }
            const result = await notificationsApi.test(access);
            toast.success(result.detail || 'Test notification sent! Check your email.', { id, duration: 5000 });
        } catch (e: any) {
            const errorMsg = e?.response?.data?.detail || e?.message || 'Failed to send test notification';
            toast.error(errorMsg, { id, duration: 5000 });
        }
    };

    return (
        <div className="settings-card">
            <h2 className="settings-card-header">NOTIFICATION PREFERENCES</h2>
            <div className="notification-list">
                {notificationItems.map(item => (
                    <div key={item.key} className="notification-item">
                        <div className="notification-text">
                            <h3 className="notification-title">{item.title}</h3>
                            <p className="notification-description">{item.description}</p>
                        </div>
                        <label className="toggle-switch">
                            <input type="checkbox" checked={prefs[item.key]} onChange={() => toggle(item.key)} />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                ))}
            </div>
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                <button 
                    type="button"
                    onClick={handleTestNotification}
                    className="button button-primary"
                    style={{ width: '100%' }}
                >
                    Send Test Notification
                </button>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
                    Send a test email to verify your notifications are working
                </p>
            </div>
        </div>
    );
};

export default function SettingsPage() {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [isTeamMemberOnly, setIsTeamMemberOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('Profile');
  
  // Check if user is team member only and set initial tab
  useEffect(() => {
    const checkTeamMemberStatus = async () => {
      try {
        const access = getAccessToken();
        if (!access) return;
        const portalData = await teamApi.getPortal(access);
        // Check if user is team member only (not owner)
        const isTeamMember = portalData.is_team_member_only === true || 
          (portalData.is_owner === false && portalData.total_enterprises > 0);
        setIsTeamMemberOnly(isTeamMember);
        
        // Set initial tab from URL, but only if allowed for user role
        if (searchParams) {
          const tabParam = searchParams.get('tab');
          if (tabParam === 'enterprise' && !isTeamMember) {
            setActiveTab('Enterprise Profile');
          } else if (tabParam === 'team' && !isTeamMember) {
            setActiveTab('Team');
          } else if (tabParam === 'notifications') {
            setActiveTab('Notifications');
          } else if (tabParam === 'account') {
            setActiveTab('Account');
          } else {
            setActiveTab('Profile');
          }
        }
      } catch (e: any) {
        // If 403 with is_owner flag, user is owner (not team member only)
        if (e?.status === 403 && e?.data?.is_owner) {
          setIsTeamMemberOnly(false);
          // Owner can access all tabs
          if (searchParams?.get('tab') === 'enterprise') {
            setActiveTab('Enterprise Profile');
          } else if (searchParams?.get('tab') === 'team') {
            setActiveTab('Team');
          }
        } else if (e?.status === 403 && e?.data?.redirect_to === '/team-portal') {
          // If redirected to team portal, they're a team member
          setIsTeamMemberOnly(true);
          setActiveTab('Profile');
        } else {
          // Default to false (owner or not logged in)
          setIsTeamMemberOnly(false);
        }
      }
    };
    checkTeamMemberStatus();
  }, [searchParams]);
  
  // Team members only see Profile, Account, and Notifications
  // Owners see all tabs
  const allTabs = ['Profile', 'Account', 'Enterprise Profile', 'Team', 'Notifications'];
  const tabs = isTeamMemberOnly 
    ? allTabs.filter(tab => ['Profile', 'Account', 'Notifications'].includes(tab))
    : allTabs;

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