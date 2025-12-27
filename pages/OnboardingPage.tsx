import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import type { UserProfile } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { Input, Select, Textarea } from '../components/Input';
import { UserIcon, BriefcaseIcon, BuildingOfficeIcon, CalendarDaysIcon, MapPinIcon, TagIcon, CameraIcon, UploadIcon, LoaderIcon, CloseIcon, LogOutIcon } from '../components/Icons';
import { supabase } from '../lib/supabaseClient';
import LocationAutocompleteInput from '../components/LocationAutocompleteInput';

const INDUSTRY_SKILLS: Record<string, string[]> = {
    'IT': [
        'React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS', 'Python', 'AWS', 'Docker',
        'GraphQL', 'SQL', 'Git', 'UI/UX Design', 'Figma', 'System Architecture',
        'Communication', 'Teamwork', 'Project Management', 'Problem Solving', 'Agile/Scrum'
    ],
    'Healthcare': [
        'Patient Care', 'Surgical Assistance', 'EMR/EHR', 'CPR Certified', 'ACLs', 'BLS',
        'Phlebotomy', 'Wound Care', 'Triage', 'Medication Administration', 'Vitals Monitoring',
        'Communication', 'Compassion', 'Critical Thinking', 'Teamwork', 'Patient Advocacy', 'LPN', 'LNA'
    ]
};

const INDUSTRY_TITLES: Record<string, string[]> = {
    'IT': [
        'Frontend Engineer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer',
        'UI/UX Designer', 'Mobile App Developer', 'Cloud Architect', 'Data Scientist',
        'Product Manager', 'Quality Assurance Engineer', 'Software Engineer', 'Technical Lead'
    ],
    'Healthcare': [
        'Registered Nurse (RN)', 'Nurse Practitioner (NP)', 'Physician Assistant (PA)',
        'Medical Assistant (MA)', 'Physical Therapist (PT)', 'Surgical Technologist',
        'Radiologic Technologist', 'Dental Hygienist', 'Pharmacist', 'Healthcare Administrator',
        'LPN (Licensed Practical Nurse)', 'LNA (Licensed Nursing Assistant)',
        'CNA (Certified Nursing Assistant)', 'Home Health Aide', 'Patient Care Technician'
    ]
};

const PhotoUploadForm: React.FC<{ onUpload: (file: File) => void, onClose: () => void }> = ({ onUpload, onClose }) => {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (preview) URL.revokeObjectURL(preview);
            setPreview(URL.createObjectURL(selectedFile));
        }
    }

    const handleDragEvents = (e: React.DragEvent, dragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(dragging);
    }

    const handleDrop = (e: React.DragEvent) => {
        handleDragEvents(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.startsWith('image/')) {
                setFile(droppedFile);
                if (preview) URL.revokeObjectURL(preview);
                setPreview(URL.createObjectURL(droppedFile));
            }
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (file) onUpload(file);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {preview ? (
                <div className="flex justify-center animate-step-in">
                    <img src={preview} alt="Preview" className="w-48 h-48 rounded-full object-cover border-4 border-emerald-500 shadow-2xl" />
                </div>
            ) : (
                <div
                    className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200 bg-zinc-50'}`}
                    onDragEnter={(e) => handleDragEvents(e, true)}
                    onDragLeave={(e) => handleDragEvents(e, false)}
                    onDragOver={(e) => handleDragEvents(e, true)}
                    onDrop={handleDrop}
                >
                    <UploadIcon className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                    <p className="text-zinc-600">Drag & drop your photo, or <label htmlFor="photo-upload" className="text-emerald-600 font-bold cursor-pointer hover:underline">browse</label></p>
                    <input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                </div>
            )}
            <div className="flex justify-center gap-4">
                <Button type="button" variant="secondary" onClick={onClose} className="rounded-2xl px-8">Maybe later</Button>
                <Button type="submit" variant="primary" disabled={!file} className="rounded-2xl px-12 shadow-lg shadow-emerald-500/20">Save Photo</Button>
            </div>
        </form>
    )
}

const TagInput: React.FC<{ label: string; tags: string[]; setTags: (tags: string[]) => void; placeholder: string; suggestions?: string[] }> = ({ label, tags, setTags, placeholder, suggestions = [] }) => {
    const [inputValue, setInputValue] = useState('');
    const filteredSuggestions = suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)).slice(0, 5);
    const recommendations = suggestions.filter(s => !tags.includes(s)).slice(0, 8);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
            setInputValue('');
        }
    };

    const removeTag = (tagToRemove: string) => setTags(tags.filter(tag => tag !== tagToRemove));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                    <span key={tag} className="flex items-center bg-emerald-50 text-emerald-600 text-sm font-bold px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm animate-step-in">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-2 hover:text-emerald-900"><CloseIcon className="w-4 h-4" /></button>
                    </span>
                ))}
            </div>

            {recommendations.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recommended for you</p>
                    <div className="flex flex-wrap gap-2">
                        {recommendations.map(req => (
                            <button
                                key={req}
                                onClick={() => setTags([...tags, req])}
                                className="px-4 py-2 rounded-2xl border border-zinc-100 bg-zinc-50/50 text-zinc-600 text-sm font-medium hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95"
                            >
                                + {req}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="relative pt-4">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full text-2xl font-medium bg-transparent border-b-2 border-zinc-200 focus:border-emerald-500 focus:outline-none py-4 transition-all"
                    autoFocus
                />
                {inputValue && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-4 bg-white border border-zinc-100 rounded-3xl shadow-2xl z-50 overflow-hidden animate-prompt-in">
                        {filteredSuggestions.map((suggestion) => (
                            <button key={suggestion} onClick={() => { setTags([...tags, suggestion]); setInputValue(''); }} className="w-full text-left px-6 py-4 hover:bg-emerald-50 hover:text-emerald-600 transition-colors border-b border-zinc-50 last:border-0 font-medium">
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const OnboardingPage: React.FC = () => {
    const { profile, updateProfile, logout, isProfileCreated, loading: profileLoading } = useProfile();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastPushedDataRef = useRef<string>('');

    const [formData, setFormData] = useState<Partial<UserProfile>>({
        photo_url: '', name: '', title: '', industry: '', experience: '', location: '', bio: '', skills: []
    });

    useEffect(() => {
        if (!profileLoading && profile && profile.role === 'recruiter') navigate('/candidates');
    }, [profile, profileLoading, navigate]);

    useEffect(() => {
        if (profile) {
            setFormData(profile);
            lastPushedDataRef.current = JSON.stringify(profile);
        }
    }, [profile]);

    useEffect(() => {
        const currentDataStr = JSON.stringify(formData);
        if (!profile || currentDataStr === lastPushedDataRef.current) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        setSaveStatus('saving');
        saveTimerRef.current = setTimeout(async () => {
            try {
                await updateProfile(formData);
                lastPushedDataRef.current = currentDataStr;
                setSaveStatus('saved');
            } catch (err) {
                setSaveStatus('error');
            }
        }, 1500);
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    }, [formData, updateProfile, profile]);

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
            await logout();
        } catch (err) {
            console.error("Logout from onboarding failed:", err);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (file: File) => {
        if (!supabase || !profile?.id) return;
        const fileExt = file.name.split('.').pop();
        const filePath = `${profile.id}/profile.${fileExt}`;
        try {
            await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const newPhotoUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
            await updateProfile({ photo_url: newPhotoUrl });
            setFormData(prev => ({ ...prev, photo_url: newPhotoUrl }));
            setIsPhotoModalOpen(false);
            setCurrentStep(s => s + 1);
        } catch (error) {
            alert("Upload failed.");
        }
    };

    const steps = [
        {
            id: 'photo',
            prompt: "Welcome! Let's build your professional story together. Mind if we start with a photo?",
            content: (
                <div className="flex justify-center">
                    <div className="relative group cursor-pointer" onClick={() => setIsPhotoModalOpen(true)}>
                        {formData.photo_url ? (
                            <img src={formData.photo_url} alt="Profile" className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-2xl transition-transform hover:scale-105" />
                        ) : (
                            <div className="w-48 h-48 rounded-full bg-zinc-100 flex items-center justify-center border-4 border-white shadow-2xl group-hover:bg-emerald-50 transition-colors">
                                <CameraIcon className="w-16 h-16 text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold">Update Photo</span>
                        </div>
                    </div>
                </div>
            ),
            isOptional: true
        },
        {
            id: 'industry',
            prompt: "First, which industry is your expertise in?",
            content: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {['IT', 'Healthcare'].map(industry => (
                        <button
                            key={industry}
                            onClick={() => {
                                setFormData(prev => ({ ...prev, industry }));
                                setCurrentStep(s => s + 1);
                            }}
                            className={`p-12 rounded-3xl border-2 transition-all text-2xl font-bold ${formData.industry === industry ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/10' : 'border-zinc-100 hover:border-emerald-200 hover:bg-zinc-50'}`}
                        >
                            {industry === 'IT' ? 'Information Technology' : industry}
                        </button>
                    ))}
                </div>
            ),
            isValid: !!formData.industry
        },
        {
            id: 'name',
            prompt: "Great choice! And who are we talking to? What's your full name?",
            content: (
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Type your name..."
                    className="w-full text-4xl font-bold bg-transparent border-b-4 border-zinc-100 focus:border-emerald-500 focus:outline-none py-4 transition-all"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && formData.name && setCurrentStep(s => s + 1)}
                />
            ),
            isValid: !!formData.name
        },
        {
            id: 'title',
            prompt: `Nice to meet you, ${formData.name?.split(' ')[0]}. What's your current job title?`,
            content: (
                <div className="relative group">
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Senior Frontend Engineer"
                        className="w-full text-4xl font-bold bg-transparent border-b-4 border-zinc-100 focus:border-emerald-500 focus:outline-none py-4 transition-all"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && formData.title && setCurrentStep(s => s + 1)}
                    />
                    {formData.title && (
                        <div className="absolute top-full left-0 mt-4 text-zinc-400 font-medium group-focus-within:opacity-0 transition-opacity">Press Enter to continue</div>
                    )}
                    {(!formData.title || formData.title.length > 0) && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            {(INDUSTRY_TITLES[formData.industry || 'IT'] || []).filter(t => t.toLowerCase().includes(formData.title?.toLowerCase() || '')).slice(0, 5).map(suggestedTitle => (
                                <button
                                    key={suggestedTitle}
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, title: suggestedTitle }));
                                        // Slight delay for visual feedback before advancing
                                        setTimeout(() => setCurrentStep(s => s + 1), 200);
                                    }}
                                    className="px-4 py-2 rounded-2xl border border-zinc-100 bg-zinc-50/50 text-zinc-600 text-sm font-medium hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                                >
                                    + {suggestedTitle}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ),
            isValid: !!formData.title
        },
        {
            id: 'location',
            prompt: "Where are you based? Recruiters love to know your local market.",
            content: (
                <LocationAutocompleteInput
                    label=""
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    placeholder="City, State..."
                    className="w-full text-4xl font-extrabold bg-transparent border-b-4 border-zinc-100 focus:border-emerald-500 focus:outline-none py-4 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && formData.location && setCurrentStep(s => s + 1)}
                />
            ),
            isValid: !!formData.location
        },
        {
            id: 'experience',
            prompt: "How many years of experience do you have in this field?",
            content: (
                <div className="space-y-8">
                    <div className="flex items-center gap-6">
                        <input
                            type="number"
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            placeholder="0"
                            className="w-32 text-6xl font-bold bg-transparent border-b-4 border-zinc-100 focus:border-emerald-500 focus:outline-none py-2 text-center"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && formData.experience && setCurrentStep(s => s + 1)}
                        />
                        <span className="text-4xl font-bold text-zinc-300 select-none">years</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4">
                        {['0', '1', '2', '3', '5', '8', '10', '15'].map(exp => (
                            <button
                                key={exp}
                                onClick={() => {
                                    setFormData(prev => ({ ...prev, experience: exp }));
                                    setTimeout(() => setCurrentStep(s => s + 1), 300);
                                }}
                                className="px-6 py-3 rounded-2xl border border-zinc-100 bg-white text-zinc-600 font-bold hover:border-emerald-300 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
                            >
                                {exp === '0' ? 'Entry Level' : (exp === '15' ? '15+ Years' : `${exp} Years`)}
                            </button>
                        ))}
                    </div>
                </div>
            ),
            isValid: !!formData.experience
        },
        {
            id: 'skills',
            prompt: "What are your core skills? Add at least three to stand out.",
            content: (
                <TagInput
                    label=""
                    tags={formData.skills || []}
                    setTags={(tags) => setFormData(prev => ({ ...prev, skills: tags }))}
                    placeholder="Add a skill..."
                    suggestions={INDUSTRY_SKILLS[formData.industry || 'IT'] || []}
                />
            ),
            isValid: (formData.skills || []).length >= 1
        },
        {
            id: 'bio',
            prompt: "Final touch: how would you describe your professional journey in a few sentences?",
            content: (
                <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="I am a passionate professional with a focus on..."
                    className="w-full text-2xl font-medium bg-transparent border-b-4 border-zinc-100 focus:border-emerald-500 focus:outline-none py-4 min-h-[200px] resize-none"
                    autoFocus
                />
            ),
            isOptional: true
        }
    ];

    if (profileLoading) return <div className="flex justify-center items-center h-screen"><LoaderIcon className="w-12 h-12 text-emerald-500 animate-spin" /></div>;

    const currentStepData = steps[currentStep];

    return (
        <div className="min-h-screen bg-white">
            {/* Header: Progress & Save Status */}
            <div className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50 bg-gradient-to-b from-white via-white/80 to-transparent">
                <div className="flex items-center gap-6">
                    <div className="flex gap-2">
                        {steps.map((_, idx) => (
                            <div key={idx} className={`h-1.5 rounded-full onboarding-progress-pill ${idx <= currentStep ? 'w-8 bg-emerald-500' : 'w-4 bg-zinc-100'}`} />
                        ))}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest transition-all">
                        {saveStatus === 'saving' && <span className="text-emerald-500 animate-pulse">Syncing...</span>}
                        {saveStatus === 'saved' && <span className="text-zinc-400 opacity-60">Everything saved</span>}
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors disabled:opacity-50"
                >
                    <span className="hidden sm:inline">{isLoggingOut ? 'Signing out...' : 'Log Out'}</span>
                    <LogOutIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Main Stage */}
            <main className="container mx-auto px-6 pt-32 pb-48 max-w-4xl">
                <div key={currentStep} className="space-y-12 animate-step-in">
                    <h2 className="text-5xl md:text-6xl font-extrabold text-zinc-900 leading-tight tracking-tight animate-prompt-in">
                        {currentStepData.prompt}
                    </h2>

                    <div className="pt-4">
                        {currentStepData.content}
                    </div>
                </div>
            </main>

            {/* Navigation Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-8 md:p-12 flex justify-between items-center bg-gradient-to-t from-white via-white/90 to-transparent pt-24">
                <Button
                    variant="secondary"
                    onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className={`rounded-2xl px-8 py-4 ${currentStep === 0 ? 'opacity-0' : ''}`}
                >
                    Back
                </Button>

                <div className="flex gap-4">
                    {currentStepData.isOptional && (
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentStep(s => s + 1)}
                            className="rounded-2xl px-8 py-4"
                        >
                            Skip for now
                        </Button>
                    )}
                    {currentStep < steps.length - 1 ? (
                        <Button
                            variant="primary"
                            onClick={() => setCurrentStep(s => s + 1)}
                            disabled={!currentStepData.isValid && !currentStepData.isOptional}
                            className="rounded-2xl px-12 py-4 shadow-xl shadow-emerald-500/20 text-lg"
                        >
                            Continue
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/profile/me')}
                            className="rounded-2xl px-12 py-4 shadow-xl shadow-emerald-500/20 text-lg"
                        >
                            Complete My Profile
                        </Button>
                    )}
                </div>
            </div>

            <Modal isOpen={isPhotoModalOpen} onClose={() => setIsPhotoModalOpen(false)} title="Add a face to the name">
                <PhotoUploadForm onUpload={handlePhotoUpload} onClose={() => setIsPhotoModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default OnboardingPage;
