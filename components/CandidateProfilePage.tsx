import React, { useState } from 'react';
import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { Candidate } from '../types';
import { getInitials, getInitialsColor } from '../utils';
import { EmailIcon, CallIcon, CarIcon, CheckDocumentIcon, DocumentTextIcon, UpdateServiceIcon, PaperclipIcon } from './icons';
import AttachDocumentModal from './AttachDocumentModal';

interface CandidateProfilePageProps {
    candidate: Candidate;
    onBack: () => void;
    onUpdateCandidate: (candidate: Candidate) => void;
    msalInstance: PublicClientApplication;
    account: AccountInfo;
}

const DetailItem: React.FC<{ label: string; value?: string | number; children?: React.ReactNode }> = ({ label, value, children }) => (
    <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        {children ? (
             <div className="mt-1 text-slate-200 font-medium">{children}</div>
        ) : (
            <p className="text-slate-200 font-medium truncate">{value || '—'}</p>
        )}
    </div>
);

const AvailabilityGrid: React.FC<{ availability: Candidate['availability'] }> = ({ availability }) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    return (
        <div className="flex flex-wrap gap-2">
            {days.map(day => (
                <div key={day} className={`px-3 py-1 rounded-full text-sm font-semibold ${availability[day as keyof typeof availability] ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                </div>
            ))}
        </div>
    );
};


const CandidateProfilePage: React.FC<CandidateProfilePageProps> = ({ candidate, onBack, onUpdateCandidate, msalInstance, account }) => {
    const [isAttachDocModalOpen, setIsAttachDocModalOpen] = useState(false);

    const handleAttachDocument = (docType: 'cv' | 'dbs', url: string) => {
        const updatedCandidate = { ...candidate };
        if (docType === 'cv') {
            updatedCandidate.cvUrl = url;
        } else {
            updatedCandidate.dbsCertificateUrl = url;
        }
        onUpdateCandidate(updatedCandidate);
    };

    return (
        <div className="p-4 md:p-6 bg-slate-800 text-slate-200 h-full flex flex-col gap-6">
            <AttachDocumentModal
                isOpen={isAttachDocModalOpen}
                onClose={() => setIsAttachDocModalOpen(false)}
                onAttach={handleAttachDocument}
                msalInstance={msalInstance}
                account={account}
            />
            {/* Header */}
            <div className="bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-700 flex-shrink-0">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="text-slate-400 hover:text-sky-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </button>
                        <div className={`w-16 h-16 rounded-full ${getInitialsColor(candidate.name)} flex items-center justify-center font-bold text-2xl text-white flex-shrink-0`}>
                            {getInitials(candidate.name)}
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">{candidate.name}</h1>
                            <p className="text-slate-400 mt-1">{candidate.location}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <a href={`mailto:${candidate.email}`} className="flex items-center bg-sky-600/20 text-sky-300 font-semibold px-4 py-2 rounded-lg hover:bg-sky-600/30 transition-colors">
                            <EmailIcon className="w-5 h-5 mr-2" />Email
                        </a>
                        <a href={`tel:${candidate.phone}`} className="flex items-center bg-emerald-500/20 text-emerald-300 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors">
                            <CallIcon className="w-5 h-5 mr-2" />Call
                        </a>
                    </div>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
                        <h2 className="text-lg font-semibold text-white mb-4">Personal Details</h2>
                        <div className="space-y-4">
                            <DetailItem label="Date of Birth" value={candidate.dob} />
                            <DetailItem label="Location" value={candidate.location} />
                            <DetailItem label="Drives" children={
                                <div className="flex items-center gap-2">
                                    <CarIcon className={`w-5 h-5 ${candidate.drives ? 'text-emerald-400' : 'text-slate-500'}`} />
                                    <span>{candidate.drives ? 'Yes' : 'No'}</span>
                                </div>
                            } />
                            <DetailItem label="Willing to Travel" value={`${candidate.willingToTravelMiles || '0'} miles`} />
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-white">Compliance & Documents</h2>
                            <button onClick={() => setIsAttachDocModalOpen(true)} className="flex items-center text-sm bg-slate-800 text-slate-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                                <PaperclipIcon className="w-4 h-4 mr-2"/>Attach
                            </button>
                        </div>
                        <div className="space-y-4">
                           <DetailItem label="DBS Check" children={
                                <div className="flex items-center gap-2">
                                    <CheckDocumentIcon className={`w-5 h-5 ${candidate.dbs ? 'text-emerald-400' : 'text-slate-500'}`} />
                                    <span>{candidate.dbs ? 'Yes' : 'No'}</span>
                                </div>
                           } />
                           <DetailItem label="On Update Service" children={
                                <div className="flex items-center gap-2">
                                    <UpdateServiceIcon className={`w-5 h-5 ${candidate.onUpdateService ? 'text-emerald-400' : 'text-slate-500'}`} />
                                    <span>{candidate.onUpdateService ? 'Yes' : 'No'}</span>
                                </div>
                           } />
                           <DetailItem label="CV" children={candidate.cvUrl ? <a href={candidate.cvUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sky-400 hover:underline"><DocumentTextIcon className="w-5 h-5"/> View Document</a> : <p className="text-slate-500">Not attached</p>} />
                           <DetailItem label="DBS Certificate" children={candidate.dbsCertificateUrl ? <a href={candidate.dbsCertificateUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sky-400 hover:underline"><DocumentTextIcon className="w-5 h-5"/> View Document</a> : <p className="text-slate-500">Not attached</p>} />
                        </div>
                    </div>
                </div>

                {/* Right Column - Availability & Notes */}
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
                        <h2 className="text-lg font-semibold text-white mb-4">Weekly Availability</h2>
                        <AvailabilityGrid availability={candidate.availability} />
                    </div>
                     <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
                        <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
                        <p className="text-slate-300 whitespace-pre-wrap">{candidate.notes || 'No notes for this candidate.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateProfilePage;