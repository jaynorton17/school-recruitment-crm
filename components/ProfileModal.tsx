

import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { SpinnerIcon, CloseIcon } from './icons';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (profile: Pick<User, 'profilePicture' | 'address' | 'mobileNumber'>) => void;
    currentUser: User;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onSave, currentUser }) => {
    const [profile, setProfile] = useState<Partial<User>>({});
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setProfile({
                profilePicture: currentUser.profilePicture,
                address: currentUser.address,
                mobileNumber: currentUser.mobileNumber,
            });
            setIsSaving(false);
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, profilePicture: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        onSave(profile as Pick<User, 'profilePicture' | 'address' | 'mobileNumber'>);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">My Profile</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <img 
                                src={profile.profilePicture || `https://ui-avatars.com/api/?name=${currentUser.name.replace(' ', '+')}&background=0ea5e9&color=fff`} 
                                alt="Profile" 
                                className="w-20 h-20 rounded-full object-cover bg-slate-700"
                            />
                        </div>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-4 py-2 rounded-lg">
                            Upload Picture
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handlePictureUpload} accept="image/*" className="hidden" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300">Address</label>
                        <textarea name="address" value={profile.address || ''} onChange={handleChange} rows={3} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300">Mobile Number</label>
                        <input type="tel" name="mobileNumber" value={profile.mobileNumber || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-600 rounded-md bg-slate-900 text-white" />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center min-w-[80px] justify-center">
                            {isSaving ? <SpinnerIcon className="w-5 h-5"/> : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;