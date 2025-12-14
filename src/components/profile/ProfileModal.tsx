import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../../contexts/DialogContext';
import { supabase } from '../../lib/supabase';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Eye, EyeOff, Shield, Lock, Check, User, Calendar, Phone } from 'lucide-react';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    forceChange?: boolean;
}

export function ProfileModal({ isOpen, onClose, forceChange = false }: ProfileModalProps) {
    const { profile, signOut } = useAuth();
    const dialog = useDialog();
    const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');

    // Profile Details State
    const [profileData, setProfileData] = useState({
        phone: '',
        dob: '',
        marriageAnniversary: '',
        joiningDate: ''
    });

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageError, setImageError] = useState(false);

    // Password Requirements
    const [requirements, setRequirements] = useState({
        length: false,
        uppercase: false,
        number: false,
        special: false,
        match: false
    });

    useEffect(() => {
        if (profile) {
            setProfileData({
                phone: profile.phone || '',
                dob: profile.dob || '',
                marriageAnniversary: profile.marriage_anniversary || '',
                joiningDate: profile.joining_date || ''
            });
        }
        if (forceChange) {
            setActiveTab('security');
        }
    }, [profile, forceChange, isOpen]);

    useEffect(() => {
        setRequirements({
            length: newPassword.length >= 8,
            uppercase: /[A-Z]/.test(newPassword),
            number: /[0-9]/.test(newPassword),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
            match: newPassword === confirmPassword && newPassword !== ''
        });
    }, [newPassword, confirmPassword]);

    const isValid = Object.values(requirements).every(Boolean);

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setImageError(false);
        // Reset profile data to current val if closed w/o saving
        if (profile) {
            setProfileData({
                phone: profile.phone || '',
                dob: profile.dob || '',
                marriageAnniversary: profile.marriage_anniversary || '',
                joiningDate: profile.joining_date || ''
            });
        }
    };

    const handleClose = () => {
        if (forceChange) return; // Prevent closing if forced
        resetForm();
        onClose();
        setTimeout(() => setActiveTab('details'), 300); // Reset tab after close
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('profiles').update({
                phone: profileData.phone,
                dob: profileData.dob || null,
                marriage_anniversary: profileData.marriageAnniversary || null,
                joining_date: profileData.joiningDate || null
            }).eq('id', profile?.id);

            if (error) throw error;

            await dialog.alert('Profile details updated successfully!', { variant: 'success', title: 'Success' });
            // We might want to refresh profile context here ideally, but Supabase realtime or next fetch will catch it.
        } catch (err: any) {
            console.error('Update profile error:', err);
            await dialog.alert(err.message || 'Failed to update profile.', { variant: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;
        setLoading(true);
        setError('');

        try {
            // 1. Update Password in Supabase Auth
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            // 2. Update force_password_change flag in profile
            if (profile) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ force_password_change: false })
                    .eq('id', profile.id);

                if (profileError) {
                    console.error('Failed to update profile flag:', profileError);
                }

                // Log the activity
                await supabase.from('activity_log').insert({
                    user_id: profile.id,
                    action: 'USER_PASSWORD_CHANGED',
                    entity_type: 'profile',
                    entity_id: profile.id,
                    details: {
                        reason: forceChange ? 'forced_change' : 'user_initiated'
                    }
                });
            }

            await dialog.alert('Password updated successfully! Please log in again with your new password.', {
                variant: 'success',
                title: 'Password Changed'
            });

            await signOut(); // Force re-login
            window.location.href = '/login';

        } catch (err: any) {
            console.error('Password change error:', err);
            setError(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={forceChange ? "Change Password Required" : "My Profile"}
            size="md"
        >
            <div className="space-y-6">
                {/* User Info Section */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    {profile?.image_url && !imageError ? (
                        <img
                            src={profile.image_url}
                            alt={profile.full_name}
                            onError={handleImageError}
                            className="w-16 h-16 rounded-full border-2 border-[#1673FF] object-cover shrink-0"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-[#E3F2FD] flex items-center justify-center border-2 border-[#1673FF] shrink-0">
                            <span className="text-xl font-bold text-[#1673FF]">{profile?.full_name?.charAt(0)}</span>
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#0A1C37] text-lg truncate" title={profile?.full_name}>{profile?.full_name}</h3>
                        <p className="text-sm text-gray-500 truncate" title={profile?.email}>{profile?.email}</p>
                        <p className="text-xs font-medium text-[#1673FF] uppercase mt-1">{profile?.role?.replace('_', ' ')}</p>
                    </div>
                </div>

                {forceChange && (
                    <div className="p-3 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-200">
                        For security reasons, you must change your password before proceeding.
                    </div>
                )}

                {!forceChange && (
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details'
                                ? 'border-[#1673FF] text-[#1673FF]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <User size={16} />
                            Profile Details
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security'
                                ? 'border-[#1673FF] text-[#1673FF]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Lock size={16} />
                            Security
                        </button>
                    </div>
                )}

                {activeTab === 'details' && !forceChange ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <Input
                            label="Phone Number"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            placeholder="+91..."
                            rightIcon={<Phone size={18} />}
                        />
                        <Input
                            type="date"
                            label="Date of Birth"
                            value={profileData.dob}
                            onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                        />
                        <Input
                            type="date"
                            label="Marriage Anniversary"
                            value={profileData.marriageAnniversary}
                            onChange={(e) => setProfileData({ ...profileData, marriageAnniversary: e.target.value })}
                        />
                        <Input
                            type="date"
                            label="Date of Joining"
                            value={profileData.joiningDate}
                            onChange={(e) => setProfileData({ ...profileData, joiningDate: e.target.value })}
                        />

                        <ModalFooter>
                            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" isLoading={loading}>
                                <span className="hidden sm:inline">Update Profile</span>
                                <span className="sm:hidden">Update</span>
                            </Button>
                        </ModalFooter>
                    </form>
                ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowPasswords(!showPasswords)}
                                className="text-gray-500 hover:text-[#1673FF] text-sm flex items-center gap-1 transition-colors"
                            >
                                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                                {showPasswords ? "Hide Passwords" : "Show Passwords"}
                            </button>
                        </div>

                        {!forceChange && (
                            <Input
                                type={showPasswords ? "text" : "password"}
                                label="Current Password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password if you want to verify"
                                className="hidden" // Hiding it for now
                            />
                        )}

                        <Input
                            type={showPasswords ? "text" : "password"}
                            label="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            placeholder="Min 8 chars, uppercase, number, special"
                        />

                        <Input
                            type={showPasswords ? "text" : "password"}
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            placeholder="Re-enter new password"
                            error={confirmPassword && !requirements.match ? "Passwords do not match" : undefined}
                        />

                        {/* Requirements Checklist */}
                        <div className="bg-gray-50 p-3 rounded-md text-xs space-y-2 border border-gray-100">
                            <p className="font-semibold text-gray-700">Password strength:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <RequirementItem met={requirements.length} text="At least 8 characters" />
                                <RequirementItem met={requirements.uppercase} text="At least one uppercase letter" />
                                <RequirementItem met={requirements.number} text="At least one number" />
                                <RequirementItem met={requirements.special} text="At least one special char (!@#$)" />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 flex items-start gap-2">
                                <Shield size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <ModalFooter>
                            <div className="grid grid-cols-2 gap-3 w-full md:flex md:w-auto md:justify-end">
                                {!forceChange && (
                                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="w-full md:w-auto">
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={loading}
                                    className={`w-full md:w-auto ${forceChange ? 'col-span-2' : ''}`}
                                    disabled={!isValid}
                                >
                                    <Lock size={16} className="mr-2" />
                                    Change Password
                                </Button>
                            </div>
                        </ModalFooter>
                    </form>
                )}
            </div>
        </Modal>
    );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-2 ${met ? 'text-green-600' : 'text-gray-500'}`}>
            {met ? <Check size={14} className="stroke-[3]" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />}
            <span>{text}</span>
        </div>
    );
}
