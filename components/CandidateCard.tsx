import React from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../types';
import { MapPinIcon, TagIcon } from './Icons';
import Button from './Button';

const Avatar: React.FC<{ photo_url: string; name: string; size?: string }> = ({ photo_url, name, size = 'h-16 w-16' }) => {
    return photo_url ? (
        <img src={photo_url} alt={name} className={`${size} rounded-full object-cover`} />
    ) : (
        <div className={`${size} bg-zinc-100 rounded-full flex items-center justify-center text-2xl font-bold text-emerald-600 border border-zinc-200`}>
            {name ? name.charAt(0) : '?'}
        </div>
    );
};

interface CandidateCardProps {
    profile: UserProfile;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ profile }) => {
    return (
        <div className="group bg-white border border-zinc-200 rounded-[2rem] shadow-sm p-8 flex flex-col h-full transform transition-all duration-500 hover:-translate-y-2 hover:border-emerald-300/50 hover:shadow-xl hover:shadow-emerald-500/5">
            <div className="flex items-center mb-6">
                <div className="relative">
                    <Avatar photo_url={profile.photo_url} name={profile.name} size="h-20 w-20" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg ring-2 ring-green-500/10"></div>
                </div>
                <div className="ml-5">
                    <h3 className="text-xl font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">{profile.name}</h3>
                    <p className="text-sm font-medium text-emerald-600 tracking-wide uppercase">{profile.title}</p>
                </div>
            </div>
            <div className="flex-grow space-y-5 text-sm">
                <div className="flex items-center text-zinc-500 group-hover:text-zinc-700 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center mr-3 border border-zinc-200 group-hover:border-emerald-500/20 shadow-sm">
                        <MapPinIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-medium">{profile.location}</span>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                        Core Expertise
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(profile.skills || []).slice(0, 3).map(skill => (
                            <span key={skill} className="bg-zinc-50 text-zinc-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-200 group-hover:border-emerald-500/20 transition-all">
                                {skill}
                            </span>
                        ))}
                        {(profile.skills || []).length > 3 && (
                            <span className="text-gray-500 text-[10px] font-bold flex items-center px-1">
                                +{(profile.skills || []).length - 3} MORE
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-zinc-100">
                <Button to={`/profile/${profile.id}`} variant="primary" className="w-full py-4 rounded-2xl font-bold text-sm shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
                    View Portfolio
                </Button>
            </div>
        </div>
    );
};

export default CandidateCard;
